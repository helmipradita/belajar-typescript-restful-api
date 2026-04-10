import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { withRedis, checkRedisHealth, disconnectRedis, redisClient } from "../src/application/redis";
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

describe("Redis Error Handling", () => {
    const originalPing = redisClient.ping;
    const originalQuit = redisClient.quit;

    afterEach(async () => {
        // Restore original methods after each test
        redisClient.ping = originalPing;
        redisClient.quit = originalQuit;
    });

    it("should handle callback errors in withRedis", async () => {
        // The callback should be able to throw errors
        await expect(withRedis(async (client) => {
            throw new Error("Callback error");
        })).rejects.toThrow("Callback error");
    });

    it("should handle health check failures", async () => {
        // Mock ping to fail
        const mockPing = jest.fn().mockRejectedValue(new Error("Ping failed"));
        redisClient.ping = mockPing;

        const result = await checkRedisHealth();
        expect(result).toBe(false);
    });

    it("should handle disconnect errors", async () => {
        // Mock quit to fail
        redisClient.quit = jest.fn().mockRejectedValue(new Error("Disconnect failed"));

        // Should not throw, just log error
        await expect(disconnectRedis()).resolves.toBeUndefined();
    });
});

describe("Redis Event Listeners", () => {
    it("should handle reconnecting event", () => {
        // The reconnecting event listener is set up in redis.ts
        // We can verify the event system works by emitting the event
        const warnSpy = jest.spyOn(logger, "warn");

        // Emit reconnecting event (this is what Redis client does)
        redisClient.emit("reconnecting");

        // The reconnecting event should trigger a warning log
        expect(warnSpy).toHaveBeenCalledWith("Redis reconnecting...");
    });

    it("should handle ECONNREFUSED error event", () => {
        const warnSpy = jest.spyOn(logger, "warn");
        const testError = { message: "ECONNREFUSED: Connection refused" };

        // Emit error event (this is what Redis client does)
        redisClient.emit("error", testError);

        // The error event with ECONNREFUSED should trigger a specific warning
        expect(warnSpy).toHaveBeenCalledWith("Redis connection refused - make sure Redis is running");
    });

    it("should handle generic error event", () => {
        const errorSpy = jest.spyOn(logger, "error");
        const testError = new Error("Some other error");

        // Emit error event without ECONNREFUSED
        redisClient.emit("error", testError);

        // The error event should trigger an error log
        expect(errorSpy).toHaveBeenCalledWith("Redis error:", testError);
    });
});
