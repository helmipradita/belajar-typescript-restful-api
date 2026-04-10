import { describe, it, expect, beforeEach, jest, afterEach } from "@jest/globals";

// Mock logger first before importing kafka
jest.mock("../src/application/logging", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock kafkajs
jest.mock("kafkajs", () => {
  const mockAdmin = {
    connect: jest.fn(),
    disconnect: jest.fn(),
  };

  const mockKafka = {
    admin: jest.fn(() => mockAdmin),
    producer: jest.fn(),
    consumer: jest.fn(),
  };

  return {
    Kafka: jest.fn(() => mockKafka),
    Partitioners: {
      DefaultPartitioner: jest.fn(),
    },
  };
});

import { kafka, kafkaTopics, verifyKafkaConnection } from "../src/application/kafka";
import { Kafka } from "kafkajs";
import { logger } from "../src/application/logging";

describe("Kafka Configuration", () => {
  describe("kafka instance", () => {
    it("should create Kafka instance with default config", () => {
      expect(Kafka).toHaveBeenCalledWith({
        clientId: "contact-api",
        brokers: ["localhost:9093"],
        logLevel: 0, // NOTHING level for test environment
      });
    });
  });

  describe("kafkaTopics", () => {
    it("should have CONTACT_AUDIT topic", () => {
      expect(kafkaTopics.CONTACT_AUDIT).toBe("contact.audit");
    });

    it("should have ADDRESS_AUDIT topic", () => {
      expect(kafkaTopics.ADDRESS_AUDIT).toBe("address.audit");
    });
  });
});

describe("verifyKafkaConnection", () => {
  let mockAdmin: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdmin = kafka.admin();
  });

  afterEach(() => {
    // Reset env after each test
    process.env.NODE_ENV = "test";
  });

  it("should return true when Kafka connection succeeds", async () => {
    mockAdmin.connect.mockResolvedValue(undefined);
    mockAdmin.disconnect.mockResolvedValue(undefined);

    const result = await verifyKafkaConnection();

    expect(result).toBe(true);
    expect(mockAdmin.connect).toHaveBeenCalled();
    expect(mockAdmin.disconnect).toHaveBeenCalled();
  });

  it("should return false when Kafka connection fails", async () => {
    mockAdmin.connect.mockRejectedValue(new Error("Connection failed"));

    const result = await verifyKafkaConnection();

    expect(result).toBe(false);
    expect(mockAdmin.connect).toHaveBeenCalled();
    expect(mockAdmin.disconnect).not.toHaveBeenCalled();
  });

  it("should handle disconnect errors gracefully", async () => {
    mockAdmin.connect.mockResolvedValue(undefined);
    mockAdmin.disconnect.mockRejectedValue(new Error("Disconnect failed"));

    const result = await verifyKafkaConnection();

    // Currently returns false on disconnect error (error is caught and returns false)
    expect(result).toBe(false);
    expect(mockAdmin.connect).toHaveBeenCalled();
    expect(mockAdmin.disconnect).toHaveBeenCalled();
  });

  it("should log success message with brokers", async () => {
    mockAdmin.connect.mockResolvedValue(undefined);
    mockAdmin.disconnect.mockResolvedValue(undefined);

    await verifyKafkaConnection();

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Kafka connection verified")
    );
  });

  it("should log error message when connection fails", async () => {
    mockAdmin.connect.mockRejectedValue(new Error("ECONNREFUSED"));

    await verifyKafkaConnection();

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to connect to Kafka")
    );
  });
});
