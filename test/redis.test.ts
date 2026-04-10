import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { withRedis, checkRedisHealth, disconnectRedis } from "../src/application/redis";
import { logger } from "../src/application/logging";

/**
 * Redis Integration Tests
 *
 * Note: These tests require Redis to be running.
 * Start Redis with: docker-compose up -d redis
 */
describe("Redis Integration", () => {
    beforeEach(async () => {
        // Ensure Redis is connected before each test
        const isHealthy = await checkRedisHealth();
        if (!isHealthy) {
            logger.warn("Redis is not running - skipping tests");
        }
    });

    afterEach(async () => {
        // Cleanup test data after each test
        try {
            await withRedis(async (client) => {
                await client.del("test:key");
                await client.del("test:expiry");
                await client.del("test:counter");
            });
        } catch (error) {
            // Ignore cleanup errors if Redis is not available
        }
    });

    it("should pass health check", async () => {
        const isHealthy = await checkRedisHealth();
        expect(isHealthy).toBe(true);
    });

    it("should set and get a value", async () => {
        await withRedis(async (client) => {
            await client.set("test:key", "Hello Redis!");
            const value = await client.get("test:key");
            expect(value).toBe("Hello Redis!");
        });
    });

    it("should set a value with expiration", async () => {
        await withRedis(async (client) => {
            await client.setEx("test:expiry", 10, "Will expire in 10s");

            const value = await client.get("test:expiry");
            expect(value).toBe("Will expire in 10s");

            const ttl = await client.ttl("test:expiry");
            expect(ttl).toBeGreaterThan(0);
            expect(ttl).toBeLessThanOrEqual(10);
        });
    });

    it("should increment a counter", async () => {
        await withRedis(async (client) => {
            await client.del("test:counter");

            const val1 = await client.incr("test:counter");
            expect(val1).toBe(1);

            const val2 = await client.incr("test:counter");
            expect(val2).toBe(2);
        });
    });

    it("should handle non-existent keys", async () => {
        await withRedis(async (client) => {
            const value = await client.get("test:nonexistent");
            expect(value).toBeNull();
        });
    });
});
