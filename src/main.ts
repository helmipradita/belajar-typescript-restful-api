import { web } from "./application/web";
import { logger } from "./application/logging";
import { disconnectRedis } from "./application/redis";
import { contactProducer } from "./producer/contact-producer";
import { AuditConsumer } from "./consumer/audit-consumer";

// Initialize Kafka Producer
let auditConsumer: AuditConsumer | null = null;

async function startKafkaProducer() {
  try {
    await contactProducer.start();
    logger.info("Kafka Producer initialized");
  } catch (error) {
    logger.error(`Failed to initialize Kafka Producer: ${error}`);
    // Continue running without Kafka - don't crash the app
  }
}

// Start Kafka Consumer (optional - can be run as separate service in production)
async function startKafkaConsumer() {
  try {
    auditConsumer = new AuditConsumer();
    await auditConsumer.start();
    logger.info("Kafka Consumer initialized");
  } catch (error) {
    logger.error(`Failed to initialize Kafka Consumer: ${error}`);
    // Continue running without consumer
  }
}

const server = web.listen(3000, async () => {
  logger.info("Listening on port 3000");

  // Start Kafka components
  await startKafkaProducer();

  // Start consumer in same process (for development)
  // In production, run as separate service
  if (process.env.ENABLE_AUDIT_CONSUMER === "true") {
    await startKafkaConsumer();
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info("HTTP server closed");

    try {
      // Shutdown Kafka components
      await contactProducer.shutdown();
      logger.info("Kafka Producer shutdown");

      if (auditConsumer && auditConsumer.isActive()) {
        await auditConsumer.shutdown();
        logger.info("Kafka Consumer shutdown");
      }

      await disconnectRedis();
      logger.info("Graceful shutdown complete");
      process.exit(0);
    } catch (error) {
      logger.error(`Error during shutdown: ${error}`);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
