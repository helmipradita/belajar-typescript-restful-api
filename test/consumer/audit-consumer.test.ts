import { describe, it, expect, beforeEach, jest, afterEach } from "@jest/globals";
import { AuditConsumer } from "../../src/consumer/audit-consumer";
import { kafka, kafkaTopics } from "../../src/application/kafka";
import { AuditEvent } from "../../src/model/audit-model";

// Mock dependencies
jest.mock("../../src/application/kafka", () => ({
  kafka: {
    consumer: jest.fn(),
  },
  kafkaTopics: {
    CONTACT_AUDIT: "contact.audit",
    ADDRESS_AUDIT: "address.audit",
  },
}));

jest.mock("../../src/application/database", () => ({
  prismaClient: {
    auditLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock("../../src/application/logging", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("AuditConsumer", () => {
  let consumer: AuditConsumer;
  let mockConsumer: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock consumer instance
    mockConsumer = {
      connect: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
      run: jest.fn().mockImplementation(({ eachMessage }) => {
        // Simulate immediate execution for testing
        eachMessage = eachMessage || jest.fn();
        return Promise.resolve();
      }),
      stop: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };

    (kafka.consumer as jest.Mock).mockReturnValue(mockConsumer);

    consumer = new AuditConsumer();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("constructor", () => {
    it("should create consumer with default group id", () => {
      expect(kafka.consumer).toHaveBeenCalledWith({ groupId: "audit-service" });
    });

    it("should create consumer with custom group id", () => {
      const customConsumer = new AuditConsumer("custom-group");
      expect(kafka.consumer).toHaveBeenCalledWith({ groupId: "custom-group" });
    });

    it("should initialize with not running state", () => {
      expect(consumer.isActive()).toBe(false);
    });
  });

  describe("start", () => {
    it("should start consumer successfully", async () => {
      await consumer.start();

      expect(mockConsumer.connect).toHaveBeenCalled();
      expect(mockConsumer.subscribe).toHaveBeenCalledWith({
        topics: [kafkaTopics.CONTACT_AUDIT, kafkaTopics.ADDRESS_AUDIT],
        fromBeginning: false,
      });
      expect(mockConsumer.run).toHaveBeenCalled();
      expect(consumer.isActive()).toBe(true);
    });

    it("should not start if already running", async () => {
      await consumer.start();
      await consumer.start(); // Call again

      expect(mockConsumer.connect).toHaveBeenCalledTimes(1);
      expect(mockConsumer.run).toHaveBeenCalledTimes(1);
    });

    it("should handle connection error", async () => {
      const error = new Error("Connection failed");
      mockConsumer.connect.mockRejectedValue(error);

      await expect(consumer.start()).rejects.toThrow("Connection failed");
      expect(consumer.isActive()).toBe(false);
    });
  });

  describe("processMessage (via mock)", () => {
    it("should process contact.created event and save to database", async () => {
      const event: AuditEvent = {
        type: "contact.created",
        entityType: "contact",
        entityId: 123,
        username: "testuser",
        timestamp: Date.now(),
        newValue: { id: 123, first_name: "Test" },
      };

      const payload = {
        topic: "contact.audit",
        partition: 0,
        message: {
          value: Buffer.from(JSON.stringify(event)),
          offset: "1",
        },
      };

      // Mock the run callback to call processMessage
      mockConsumer.run.mockImplementation(({ eachMessage }) => {
        eachMessage(payload);
        return Promise.resolve();
      });

      await consumer.start();

      const { prismaClient } = require("../../src/application/database");
      expect(prismaClient.auditLog.create).toHaveBeenCalledWith({
        data: {
          eventType: event.type,
          entityType: event.entityType,
          entityId: event.entityId,
          username: event.username,
          timestamp: expect.any(Date),
          oldValue: event.oldValue,
          newValue: event.newValue,
        },
      });
    });

    it("should handle address.updated event", async () => {
      const event: AuditEvent = {
        type: "address.updated",
        entityType: "address",
        entityId: 456,
        username: "testuser",
        oldValue: { street: "Old Street" },
        newValue: { street: "New Street" },
      };

      const payload = {
        topic: "address.audit",
        partition: 0,
        message: {
          value: Buffer.from(JSON.stringify(event)),
          offset: "2",
        },
      };

      mockConsumer.run.mockImplementation(({ eachMessage }) => {
        eachMessage(payload);
        return Promise.resolve();
      });

      await consumer.start();

      const { prismaClient } = require("../../src/application/database");
      expect(prismaClient.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: "address.updated",
          entityType: "address",
          entityId: 456,
          oldValue: { street: "Old Street" },
          newValue: { street: "New Street" },
        }),
      });
    });

    it("should handle message with null value gracefully", async () => {
      const payload = {
        topic: "contact.audit",
        partition: 0,
        message: {
          value: null,
          offset: "3",
        },
      };

      mockConsumer.run.mockImplementation(({ eachMessage }) => {
        eachMessage(payload);
        return Promise.resolve();
      });

      await consumer.start();

      const { prismaClient } = require("../../src/application/database");
      expect(prismaClient.auditLog.create).not.toHaveBeenCalled();
    });

    it("should handle invalid JSON gracefully", async () => {
      const payload = {
        topic: "contact.audit",
        partition: 0,
        message: {
          value: Buffer.from("invalid json{"),
          offset: "4",
        },
      };

      mockConsumer.run.mockImplementation(({ eachMessage }) => {
        eachMessage(payload);
        return Promise.resolve();
      });

      // Should not throw
      await expect(consumer.start()).resolves.toBeUndefined();
    });

    it("should handle database error without throwing", async () => {
      const event: AuditEvent = {
        type: "contact.created",
        entityType: "contact",
        entityId: 123,
        username: "testuser",
        newValue: { id: 123 },
      };

      const payload = {
        topic: "contact.audit",
        partition: 0,
        message: {
          value: Buffer.from(JSON.stringify(event)),
          offset: "5",
        },
      };

      const { prismaClient } = require("../../src/application/database");
      prismaClient.auditLog.create.mockRejectedValue(new Error("DB Error"));

      mockConsumer.run.mockImplementation(({ eachMessage }) => {
        eachMessage(payload);
        return Promise.resolve();
      });

      // Should not throw
      await expect(consumer.start()).resolves.toBeUndefined();
    });

    it("should use current timestamp when event timestamp is not provided", async () => {
      const beforeTime = new Date();

      const event: AuditEvent = {
        type: "contact.deleted",
        entityType: "contact",
        entityId: 123,
        username: "testuser",
        oldValue: { id: 123, first_name: "Test" },
      };

      const payload = {
        topic: "contact.audit",
        partition: 0,
        message: {
          value: Buffer.from(JSON.stringify(event)),
          offset: "6",
        },
      };

      mockConsumer.run.mockImplementation(({ eachMessage }) => {
        eachMessage(payload);
        return Promise.resolve();
      });

      await consumer.start();

      const { prismaClient } = require("../../src/application/database");
      const callArgs = prismaClient.auditLog.create.mock.calls[0][0];

      expect(callArgs.data.timestamp).toBeInstanceOf(Date);
      expect(callArgs.data.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });
  });

  describe("shutdown", () => {
    it("should shutdown consumer successfully", async () => {
      await consumer.start();
      await consumer.shutdown();

      expect(mockConsumer.stop).toHaveBeenCalled();
      expect(mockConsumer.disconnect).toHaveBeenCalled();
      expect(consumer.isActive()).toBe(false);
    });

    it("should do nothing if consumer is not running", async () => {
      await consumer.shutdown();

      expect(mockConsumer.stop).not.toHaveBeenCalled();
      expect(mockConsumer.disconnect).not.toHaveBeenCalled();
    });

    it("should handle shutdown error gracefully", async () => {
      await consumer.start();

      const error = new Error("Shutdown failed");
      mockConsumer.stop.mockRejectedValue(error);

      // Should not throw
      await expect(consumer.shutdown()).resolves.toBeUndefined();
      expect(consumer.isActive()).toBe(false);
    });
  });

  describe("isActive", () => {
    it("should return false when not running", () => {
      expect(consumer.isActive()).toBe(false);
    });

    it("should return true when running", async () => {
      await consumer.start();
      expect(consumer.isActive()).toBe(true);
    });

    it("should return false after shutdown", async () => {
      await consumer.start();
      await consumer.shutdown();
      expect(consumer.isActive()).toBe(false);
    });
  });
});
