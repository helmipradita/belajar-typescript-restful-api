# Perbedaan src/main.ts

## Current Version (117 lines)

```typescript
import { web } from "./application/web";
import { logger } from "./application/logging";
import { disconnectRedis } from "./application/redis";
import { contactProducer } from "./producer/contact-producer";
import { prismaClient } from "./application/database";

// Track shutdown state
let isShuttingDown = false;

// Initialize Kafka Producer
async function startKafkaProducer() {
  try {
    await contactProducer.start();
    logger.info("Kafka Producer initialized");
  } catch (error) {
    logger.error(`Failed to initialize Kafka Producer: ${error}`);
    // Continue running without Kafka - don't crash the app
  }
}

const server = web.listen(3000, async () => {
  logger.info("Listening on port 3000");

  // Start Kafka Producer
  await startKafkaProducer();
});

// Handle server errors
server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    logger.error(`Port 3000 is already in use. Another instance may be running.`);
    logger.error("Run 'pkill -f \"ts-node src/main.ts\"' to kill orphaned processes");
    process.exit(1);
  } else {
    logger.error(`Server error: ${error}`);
    process.exit(1);
  }
});

// Graceful shutdown handler with proper cleanup sequence
const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) {
    logger.warn("Shutdown already in progress, ignoring duplicate signal");
    return;
  }

  isShuttingDown = true;
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Create a timeout promise that rejects after 30 seconds
  const shutdownTimeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Graceful shutdown timeout after 30s")), 30000);
  });

  try {
    // Step 1: Stop accepting new HTTP requests (close server)
    await Promise.race([
      new Promise<void>((resolve) => {
        server.close(() => {
          logger.info("HTTP server closed");
          resolve();
        });
      }),
      shutdownTimeout
    ]);

    // Step 2: Shutdown Kafka Producer (flush pending messages first)
    if (contactProducer.isReady()) {
      logger.info("Shutting down Kafka Producer...");
      await Promise.race([
        contactProducer.shutdown(),
        shutdownTimeout
      ]);
      logger.info("Kafka Producer shutdown");
    }

    // Step 3: Disconnect from Redis
    await Promise.race([
      disconnectRedis(),
      shutdownTimeout
    ]);
    logger.info("Redis disconnected");

    // Step 4: Disconnect from Database (Prisma)
    await Promise.race([
      prismaClient.$disconnect(),
      shutdownTimeout
    ]);
    logger.info("Database disconnected");

    logger.info("Graceful shutdown complete");
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
  // Don't exit immediately, log and continue
  // In production, you might want to implement circuit breaker here
});
```

---

## PZN Version (7 lines)

```typescript
import {web} from "./application/web";
import {logger} from "./application/logging";

web.listen(3000, () => {
    logger.info("Listening on port 3000");
})
```

---

## Perbedaan

| Aspect | Current | PZN |
|--------|---------|-----|
| Lines | 117 | 7 |
| Imports | 5 (termasuk Kafka, Redis) | 2 |
| Graceful Shutdown | ✅ | ❌ |
| Kafka Producer Init | ✅ | ❌ |
| Signal Handlers | ✅ (SIGTERM, SIGINT, SIGUSR2) | ❌ |
| Error Handling (EADDRINUSE) | ✅ | ❌ |
| Uncaught Exception Handler | ✅ | ❌ |
| Unhandled Rejection Handler | ✅ | ❌ |
| Cleanup Sequence | ✅ 4 steps | ❌ |

---

## Catatan

Jika kita menghapus bagian Kafka dan Redis dari Current version, kira-kira akan menjadi seperti ini (sekitar 70 lines):

```typescript
import { web } from "./application/web";
import { logger } from "./application/logging";
import { prismaClient } from "./application/database";

let isShuttingDown = false;

const server = web.listen(3000, async () => {
  logger.info("Listening on port 3000");
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    logger.error(`Port 3000 is already in use.`);
    process.exit(1);
  } else {
    logger.error(`Server error: ${error}`);
    process.exit(1);
  }
});

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`${signal} received. Starting graceful shutdown...`);

  const shutdownTimeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Graceful shutdown timeout after 30s")), 30000);
  });

  try {
    await Promise.race([
      new Promise<void>((resolve) => {
        server.close(() => {
          logger.info("HTTP server closed");
          resolve();
        });
      }),
      shutdownTimeout
    ]);

    await Promise.race([
      prismaClient.$disconnect(),
      shutdownTimeout
    ]);
    logger.info("Database disconnected");

    logger.info("Graceful shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error(`Error during shutdown: ${error}`);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2"));

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException").catch(() => process.exit(1));
});

process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});
```

**Versi tanpa Kafka/Redis**: ~70 lines
**PZN Version**: 7 lines

**Perbedaan murni**: Graceful shutdown, error handling, signal handlers.
