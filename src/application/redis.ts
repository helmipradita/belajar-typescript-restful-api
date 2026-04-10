import { createClient, RedisClientType } from "redis";
import { logger } from "./logging";

/**
 * Redis Client Configuration
 * Following the same pattern as database.ts for consistency
 */
const redisUrl = process.env.REDIS_URL || "redis://localhost:6380";

const redisClient = createClient({
    url: redisUrl,
    socket: {
        reconnectStrategy: (retries: number) => {
            if (retries > 10) {
                logger.error("Redis reconnection failed after 10 retries");
                return new Error("Redis reconnection failed");
            }
            const delay = Math.min(retries * 100, 2000);
            logger.info(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
            return delay;
        }
    }
});

/**
 * Track connection state
 */
let isConnected = false;

/**
 * Connect to Redis (called automatically on first use)
 */
async function ensureConnected(): Promise<void> {
    if (!isConnected) {
        try {
            await redisClient.connect();
            isConnected = true;
        } catch (error) {
            logger.error("Failed to connect to Redis:", error);
            throw error;
        }
    }
}

/**
 * Redis Event Listeners for Logging
 */
redisClient.on("connect", () => {
    logger.info("Redis connecting...");
});

redisClient.on("ready", () => {
    logger.info("Redis connected and ready");
    isConnected = true;
});

redisClient.on("reconnecting", () => {
    logger.warn("Redis reconnecting...");
    isConnected = false;
});

redisClient.on("error", (err: Error) => {
    if ((err as any).message?.includes("ECONNREFUSED")) {
        logger.warn("Redis connection refused - make sure Redis is running");
    } else {
        logger.error("Redis error:", err);
    }
});

redisClient.on("end", () => {
    logger.info("Redis connection closed");
    isConnected = false;
});

/**
 * Helper function to execute Redis operations with auto-connect
 */
export const withRedis = async <T>(
    callback: (client: typeof redisClient) => Promise<T>
): Promise<T> => {
    await ensureConnected();
    try {
        return await callback(redisClient);
    } catch (error) {
        logger.error("Redis operation failed:", error);
        throw error;
    }
};

/**
 * Graceful shutdown handler for Redis connection
 */
export const disconnectRedis = async (): Promise<void> => {
    try {
        await redisClient.quit();
        isConnected = false;
        logger.info("Redis disconnected gracefully");
    } catch (error) {
        logger.error("Error disconnecting Redis:", error);
    }
};

/**
 * Check Redis health
 */
export const checkRedisHealth = async (): Promise<boolean> => {
    try {
        await ensureConnected();
        const result = await redisClient.ping();
        return result === "PONG";
    } catch {
        logger.error("Redis health check failed");
        return false;
    }
};

export { redisClient };
