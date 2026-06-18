import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "./logging";

export const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        if (times > 5) {
            logger.error({ event: "redis.retry_exhausted", attempts: times });
            return null;
        }
        return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
    enableReadyCheck: true,
});

redis.on("connect", () => {
    logger.info({ event: "redis.connected" });
});

redis.on("ready", () => {
    logger.info({ event: "redis.ready" });
});

redis.on("error", (err) => {
    logger.error({ event: "redis.error", error: err.message });
});

redis.on("close", () => {
    logger.warn({ event: "redis.closed" });
});

redis.on("reconnecting", (delay: number) => {
    logger.info({ event: "redis.reconnecting", delay_ms: delay });
});
