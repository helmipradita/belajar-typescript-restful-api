import { logger } from "./application/logging";
import { disconnectRedis } from "./application/redis";
import { AuditConsumer } from "./consumer/audit-consumer";
import { prismaClient } from "./application/database";

let auditConsumer: AuditConsumer | null = null;

// Track shutdown state
let isShuttingDown = false;

async function start() {
  try {
    logger.info("Starting Kafka Consumer Service...");

    auditConsumer = new AuditConsumer();
    await auditConsumer.start();

    logger.info("Kafka Consumer Service is running");
    logger.info("Subscribed to: contact.audit, address.audit");

  } catch (error) {
    logger.error(`Failed to start Kafka Consumer Service: ${error}`);
    process.exit(1);
  }
}

// Graceful shutdown handler with proper cleanup sequence
const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) {
    logger.warn("Shutdown already in progress, ignoring duplicate signal");
    return;
  }

  isShuttingDown = true;
  logger.info(`${signal} received. Shutting down Kafka Consumer Service...`);

  // Create a timeout promise that rejects after 30 seconds
  const shutdownTimeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Graceful shutdown timeout after 30s")), 30000);
  });

  try {
    // Step 1: Stop consuming and disconnect Kafka Consumer
    if (auditConsumer && auditConsumer.isActive()) {
      logger.info("Stopping Kafka Consumer...");
      await Promise.race([
        auditConsumer.shutdown(),
        shutdownTimeout
      ]);
      logger.info("Kafka Consumer stopped");
    }

    // Step 2: Disconnect from Redis
    await Promise.race([
      disconnectRedis(),
      shutdownTimeout
    ]);
    logger.info("Redis disconnected");

    // Step 3: Disconnect from Database (Prisma)
    await Promise.race([
      prismaClient.$disconnect(),
      shutdownTimeout
    ]);
    logger.info("Database disconnected");

    logger.info("Kafka Consumer Service shutdown complete");
    process.exit(0);

  } catch (error) {
    logger.error(`Error during shutdown: ${error}`);
    process.exit(1);
  }
};

// Handle process signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2")); // nodemon restart

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException").catch(() => process.exit(1));
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit immediately for consumer - log and continue
  // The consumer should be resilient to temporary failures
});

// Start the service
start();
