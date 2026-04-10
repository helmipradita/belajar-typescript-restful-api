import { describe, it, expect, beforeEach, jest, afterEach } from "@jest/globals";
import { ContactProducer } from "../../src/producer/contact-producer";
import { kafka, kafkaTopics } from "../../src/application/kafka";
import { AuditEvent } from "../../src/model/audit-model";

// Mock dependencies
jest.mock("../../src/application/kafka", () => ({
  kafka: {
    producer: jest.fn(),
  },
  kafkaTopics: {
    CONTACT_AUDIT: "contact.audit",
    ADDRESS_AUDIT: "address.audit",
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

describe("ContactProducer", () => {
  let producer: ContactProducer;
  let mockProducer: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock producer instance
    mockProducer = {
      connect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };

    // Mock kafka.producer to return our mock
    (kafka.producer as jest.Mock).mockReturnValue(mockProducer);

    producer = new ContactProducer();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("constructor", () => {
    it("should create producer instance with default partitioner", () => {
      expect(kafka.producer).toHaveBeenCalledWith({
        createPartitioner: expect.any(Function),
      });
    });

    it("should initialize with disconnected state", () => {
      expect(producer.isReady()).toBe(false);
    });
  });

  describe("start", () => {
    it("should connect producer successfully", async () => {
      await producer.start();

      expect(mockProducer.connect).toHaveBeenCalled();
      expect(producer.isReady()).toBe(true);
    });

    it("should not connect if already connected", async () => {
      await producer.start();
      await producer.start(); // Call again

      expect(mockProducer.connect).toHaveBeenCalledTimes(1);
    });

    it("should handle connection error gracefully", async () => {
      const error = new Error("Connection failed");
      mockProducer.connect.mockRejectedValue(error);

      await expect(producer.start()).rejects.toThrow("Connection failed");
      expect(producer.isReady()).toBe(false);
    });
  });

  describe("publishAuditEvent", () => {
    beforeEach(async () => {
      await producer.start();
    });

    it("should publish contact event to CONTACT_AUDIT topic", async () => {
      const event: AuditEvent = {
        type: "contact.created",
        entityType: "contact",
        entityId: 123,
        username: "testuser",
        timestamp: Date.now(),
        newValue: { id: 123, first_name: "Test" },
      };

      await producer.publishAuditEvent(event);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: kafkaTopics.CONTACT_AUDIT,
        messages: [
          {
            key: "testuser",
            value: JSON.stringify(event),
            timestamp: expect.any(String),
          },
        ],
      });
    });

    it("should publish address event to ADDRESS_AUDIT topic", async () => {
      const event: AuditEvent = {
        type: "address.created",
        entityType: "address",
        entityId: 456,
        username: "testuser",
        newValue: { id: 456, street: "Test Street" },
      };

      await producer.publishAuditEvent(event);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: kafkaTopics.ADDRESS_AUDIT,
        messages: [
          {
            key: "testuser",
            value: JSON.stringify(event),
            timestamp: expect.any(String),
          },
        ],
      });
    });

    it("should skip publish when producer is not connected", async () => {
      // Create new producer without starting
      const newProducer = new ContactProducer();

      const event: AuditEvent = {
        type: "contact.created",
        entityType: "contact",
        entityId: 123,
        username: "testuser",
        newValue: { id: 123 },
      };

      await newProducer.publishAuditEvent(event);

      expect(mockProducer.send).not.toHaveBeenCalled();
    });

    it("should handle publish error without throwing", async () => {
      const error = new Error("Publish failed");
      mockProducer.send.mockRejectedValue(error);

      const event: AuditEvent = {
        type: "contact.created",
        entityType: "contact",
        entityId: 123,
        username: "testuser",
        newValue: { id: 123 },
      };

      // Should not throw
      await expect(producer.publishAuditEvent(event)).resolves.toBeUndefined();
    });

    it("should use current timestamp when event timestamp is not provided", async () => {
      const beforeTime = Date.now();

      const event: AuditEvent = {
        type: "contact.created",
        entityType: "contact",
        entityId: 123,
        username: "testuser",
        newValue: { id: 123 },
      };

      await producer.publishAuditEvent(event);

      const afterTime = Date.now();

      const sentMessage = mockProducer.send.mock.calls[0][0].messages[0];
      const sentTimestamp = parseInt(sentMessage.timestamp, 10);

      expect(sentTimestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(sentTimestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe("shutdown", () => {
    it("should disconnect producer successfully", async () => {
      await producer.start();
      await producer.shutdown();

      expect(mockProducer.disconnect).toHaveBeenCalled();
      expect(producer.isReady()).toBe(false);
    });

    it("should do nothing if producer is not connected", async () => {
      await producer.shutdown();

      expect(mockProducer.disconnect).not.toHaveBeenCalled();
    });

    it("should handle disconnect error gracefully", async () => {
      await producer.start();
      const error = new Error("Disconnect failed");
      mockProducer.disconnect.mockRejectedValue(error);

      // Should not throw
      await expect(producer.shutdown()).resolves.toBeUndefined();
      expect(producer.isReady()).toBe(false);
    });
  });

  describe("isReady", () => {
    it("should return false when not connected", () => {
      expect(producer.isReady()).toBe(false);
    });

    it("should return true when connected", async () => {
      await producer.start();
      expect(producer.isReady()).toBe(true);
    });

    it("should return false after shutdown", async () => {
      await producer.start();
      await producer.shutdown();
      expect(producer.isReady()).toBe(false);
    });
  });
});
