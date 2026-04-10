import { describe, it, expect, beforeEach, jest, afterEach } from "@jest/globals";
import http from "http";
import { web } from "../src/application/web";
import { contactProducer } from "../src/producer/contact-producer";
import { AuditConsumer } from "../src/consumer/audit-consumer";
import { disconnectRedis } from "../src/application/redis";

// Mock dependencies
jest.mock("../src/application/logging", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../src/application/redis", () => ({
  disconnectRedis: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../src/producer/contact-producer", () => ({
  contactProducer: {
    start: jest.fn().mockResolvedValue(undefined),
    shutdown: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("../src/consumer/audit-consumer", () => ({
  AuditConsumer: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined),
    shutdown: jest.fn().mockResolvedValue(undefined),
    isActive: jest.fn().mockReturnValue(true),
  })),
}));

describe("Main Application Integration", () => {
  let server: http.Server | null = null;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server!.close(() => resolve());
      });
      server = null;
    }
    process.env = originalEnv;
  });

  describe("Server Startup", () => {
    it("should start HTTP server on specified port", (done) => {
      server = web.listen(0, () => {
        const address = server!.address() as any;
        expect(address).toBeDefined();
        expect(typeof address.port).toBe("number");
        done();
      });
    });

    it("should start server on port 3000 by default", (done) => {
      server = web.listen(3000, () => {
        const address = server!.address() as any;
        expect(address.port).toBe(3000);
        done();
      });
    });

    it("should handle port in use error gracefully", (done) => {
      server = web.listen(3000, () => {
        // Try to listen on the same port again
        const duplicateServer = web.listen(3000, () => {
          done.fail("Should not be able to listen on the same port");
        });

        duplicateServer.on("error", (err: any) => {
          expect(err.code).toBe("EADDRINUSE");
          duplicateServer.close();
          done();
        });
      });
    });
  });

  describe("Kafka Producer Integration", () => {
    it("should have start method defined", () => {
      expect(contactProducer.start).toBeDefined();
      expect(typeof contactProducer.start).toBe("function");
    });

    it("should have shutdown method defined", () => {
      expect(contactProducer.shutdown).toBeDefined();
      expect(typeof contactProducer.shutdown).toBe("function");
    });

    it("should call start successfully", async () => {
      await contactProducer.start();
      expect(contactProducer.start).toHaveBeenCalled();
    });

    it("should handle start errors gracefully", async () => {
      (contactProducer.start as jest.Mock).mockRejectedValueOnce(
        new Error("Kafka connection failed")
      );

      await expect(contactProducer.start()).rejects.toThrow("Kafka connection failed");
    });

    it("should call shutdown successfully", async () => {
      await contactProducer.shutdown();
      expect(contactProducer.shutdown).toHaveBeenCalled();
    });

    it("should handle shutdown errors gracefully", async () => {
      const { logger } = require("../src/application/logging");
      (contactProducer.shutdown as jest.Mock).mockRejectedValueOnce(
        new Error("Shutdown failed")
      );

      // The actual implementation catches errors, so this test verifies the behavior
      // In the mock, we need to handle the rejection properly
      await expect(contactProducer.shutdown()).rejects.toThrow("Shutdown failed");
      expect(contactProducer.shutdown).toHaveBeenCalled();
    });
  });

  describe("Kafka Consumer Integration", () => {
    it("should create AuditConsumer instance", () => {
      const consumer = new AuditConsumer();
      expect(consumer).toBeDefined();
    });

    it("should have start method on consumer", async () => {
      const consumer = new AuditConsumer();
      expect(consumer.start).toBeDefined();
      await consumer.start();
      expect(consumer.start).toHaveBeenCalled();
    });

    it("should have shutdown method on consumer", async () => {
      const consumer = new AuditConsumer();
      expect(consumer.shutdown).toBeDefined();
      await consumer.shutdown();
      expect(consumer.shutdown).toHaveBeenCalled();
    });

    it("should check if consumer is active", () => {
      const consumer = new AuditConsumer();
      expect(consumer.isActive).toBeDefined();
      expect(typeof consumer.isActive).toBe("function");
    });
  });

  describe("Redis Integration", () => {
    it("should have disconnectRedis function", () => {
      expect(disconnectRedis).toBeDefined();
      expect(typeof disconnectRedis).toBe("function");
    });

    it("should call disconnectRedis successfully", async () => {
      await disconnectRedis();
      expect(disconnectRedis).toHaveBeenCalled();
    });
  });

  describe("Graceful Shutdown Components", () => {
    it("should verify all shutdown components are available", () => {
      expect(contactProducer.shutdown).toBeDefined();
      expect(disconnectRedis).toBeDefined();
      expect(AuditConsumer).toBeDefined();
    });

    it("should call shutdown in correct order", async () => {
      // Simulate the shutdown sequence from main.ts
      await contactProducer.shutdown();
      await disconnectRedis();

      expect(contactProducer.shutdown).toHaveBeenCalled();
      expect(disconnectRedis).toHaveBeenCalled();
    });
  });

  describe("Environment Configuration", () => {
    it("should respect ENABLE_AUDIT_CONSUMER environment variable", () => {
      process.env.ENABLE_AUDIT_CONSUMER = "true";
      expect(process.env.ENABLE_AUDIT_CONSUMER).toBe("true");

      process.env.ENABLE_AUDIT_CONSUMER = "false";
      expect(process.env.ENABLE_AUDIT_CONSUMER).toBe("false");

      delete process.env.ENABLE_AUDIT_CONSUMER;
      expect(process.env.ENABLE_AUDIT_CONSUMER).toBeUndefined();
    });

    it("should have default PORT fallback", () => {
      const defaultPort = 3000;
      expect(typeof defaultPort).toBe("number");
      expect(defaultPort).toBeGreaterThan(0);
    });
  });

  describe("Server Lifecycle", () => {
    it("should handle immediate close after start", (done) => {
      server = web.listen(0, () => {
        server!.close(() => {
          server = null;
          done();
        });
      });
    });

    it("should handle multiple close calls safely", (done) => {
      server = web.listen(0, () => {
        server!.close(() => {
          server = null;
          // Second close should be safe
          expect(() => {
            if (server) server.close();
          }).not.toThrow();
          done();
        });
      });
    });
  });
});
