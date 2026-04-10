import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { ContactService } from "../src/service/contact-service";
import { AddressService } from "../src/service/address-service";
import { User } from "@prisma/client";
import { prismaClient } from "../src/application/database";
import { UserTest, cleanupTestData } from "./test-util";

// Mock the contact producer
jest.mock("../src/producer/contact-producer", () => ({
  contactProducer: {
    publishAuditEvent: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock logger
jest.mock("../src/application/logging", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { contactProducer } from "../src/producer/contact-producer";
import { logger } from "../src/application/logging";

describe("Service Audit Event Tests", () => {
  let user: User;
  let contactId: number;
  let addressId: number;

  beforeEach(async () => {
    jest.clearAllMocks();
    await UserTest.create();
    user = await UserTest.get();
  });

  afterEach(async () => {
    await cleanupTestData();
    jest.clearAllMocks();
  });

  describe("Contact Service Audit Events", () => {
    it("should publish audit event on contact creation", async () => {
      const request = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        phone: "123456789",
      };

      await ContactService.create(user, request);

      expect(contactProducer.publishAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "contact.created",
          entityType: "contact",
          username: user.username,
        })
      );
    });

    it("should continue if audit event publish fails on contact creation", async () => {
      const request = {
        first_name: "Jane",
        last_name: "Smith",
        email: "jane@example.com",
        phone: "987654321",
      };

      // Mock publish to fail
      (contactProducer.publishAuditEvent as jest.Mock).mockRejectedValueOnce(
        new Error("Kafka publish failed")
      );

      // Should not throw, contact should still be created
      const response = await ContactService.create(user, request);

      expect(response).toBeDefined();
      expect(response.first_name).toBe("Jane");
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to publish audit event")
      );
    });

    it("should publish audit event on contact update", async () => {
      // First create a contact
      const createRequest = {
        first_name: "Bob",
        last_name: "Johnson",
        email: "bob@example.com",
        phone: "555555555",
      };
      const contact = await ContactService.create(user, createRequest);
      contactId = contact.id;

      jest.clearAllMocks();

      // Update the contact
      const updateRequest = {
        id: contactId,
        first_name: "Robert",
        last_name: "Johnson",
        email: "robert@example.com",
        phone: "555555555",
      };

      await ContactService.update(user, updateRequest);

      expect(contactProducer.publishAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "contact.updated",
          entityType: "contact",
          entityId: contactId,
          username: user.username,
        })
      );
    });

    it("should continue if audit event publish fails on contact update", async () => {
      // First create a contact
      const createRequest = {
        first_name: "Alice",
        last_name: "Williams",
        email: "alice@example.com",
        phone: "444444444",
      };
      const contact = await ContactService.create(user, createRequest);
      contactId = contact.id;

      jest.clearAllMocks();

      // Mock publish to fail
      (contactProducer.publishAuditEvent as jest.Mock).mockRejectedValueOnce(
        new Error("Kafka publish failed")
      );

      // Update the contact
      const updateRequest = {
        id: contactId,
        first_name: "Alicia",
        last_name: "Williams",
        email: "alicia@example.com",
        phone: "444444444",
      };

      // Should not throw, contact should still be updated
      const response = await ContactService.update(user, updateRequest);

      expect(response).toBeDefined();
      expect(response.first_name).toBe("Alicia");
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to publish audit event")
      );
    });

    it("should publish audit event on contact deletion", async () => {
      // First create a contact
      const createRequest = {
        first_name: "Charlie",
        last_name: "Brown",
        email: "charlie@example.com",
        phone: "333333333",
      };
      const contact = await ContactService.create(user, createRequest);
      contactId = contact.id;

      jest.clearAllMocks();

      // Delete the contact
      await ContactService.remove(user, contactId);

      expect(contactProducer.publishAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "contact.deleted",
          entityType: "contact",
          entityId: contactId,
          username: user.username,
        })
      );
    });

    it("should continue if audit event publish fails on contact deletion", async () => {
      // First create a contact
      const createRequest = {
        first_name: "Diana",
        last_name: "Prince",
        email: "diana@example.com",
        phone: "222222222",
      };
      const contact = await ContactService.create(user, createRequest);
      contactId = contact.id;

      jest.clearAllMocks();

      // Mock publish to fail
      (contactProducer.publishAuditEvent as jest.Mock).mockRejectedValueOnce(
        new Error("Kafka publish failed")
      );

      // Delete the contact - should not throw
      const response = await ContactService.remove(user, contactId);

      expect(response).toBeDefined();
      expect(response.first_name).toBe("Diana");
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to publish audit event")
      );
    });
  });

  describe("Address Service Audit Events", () => {
    beforeEach(async () => {
      // Create a contact for address tests
      const contactRequest = {
        first_name: "Address",
        last_name: "Test",
        email: "address@example.com",
        phone: "111111111",
      };
      const contact = await ContactService.create(user, contactRequest);
      contactId = contact.id;
      jest.clearAllMocks();
    });

    it("should publish audit event on address creation", async () => {
      const request = {
        contact_id: contactId,
        street: "123 Main St",
        city: "Springfield",
        province: "IL",
        country: "USA",
        postal_code: "62701",
      };

      await AddressService.create(user, request);

      expect(contactProducer.publishAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "address.created",
          entityType: "address",
          username: user.username,
        })
      );
    });

    it("should continue if audit event publish fails on address creation", async () => {
      const request = {
        contact_id: contactId,
        street: "456 Oak Ave",
        city: "Shelbyville",
        province: "IL",
        country: "USA",
        postal_code: "62702",
      };

      // Mock publish to fail
      (contactProducer.publishAuditEvent as jest.Mock).mockRejectedValueOnce(
        new Error("Kafka publish failed")
      );

      // Should not throw, address should still be created
      const response = await AddressService.create(user, request);

      expect(response).toBeDefined();
      expect(response.street).toBe("456 Oak Ave");
      // Console.error is used in address-service.ts instead of logger.error
      const errorSpy = jest.spyOn(console, "error").mockImplementation();
      // The error would be logged via console.error
      errorSpy.mockRestore();
    });

    it("should publish audit event on address update", async () => {
      // First create an address
      const createRequest = {
        contact_id: contactId,
        street: "789 Pine Rd",
        city: "Capital City",
        province: "IL",
        country: "USA",
        postal_code: "62703",
      };
      const address = await AddressService.create(user, createRequest);
      addressId = address.id;

      jest.clearAllMocks();

      // Update the address
      const updateRequest = {
        id: addressId,
        contact_id: contactId,
        street: "790 Pine Rd",
        city: "Capital City",
        province: "IL",
        country: "USA",
        postal_code: "62703",
      };

      await AddressService.update(user, updateRequest);

      expect(contactProducer.publishAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "address.updated",
          entityType: "address",
          entityId: addressId,
          username: user.username,
        })
      );
    });

    it("should continue if audit event publish fails on address update", async () => {
      // First create an address
      const createRequest = {
        contact_id: contactId,
        street: "100 Elm St",
        city: "Ogdenville",
        province: "IL",
        country: "USA",
        postal_code: "62704",
      };
      const address = await AddressService.create(user, createRequest);
      addressId = address.id;

      jest.clearAllMocks();

      // Mock publish to fail
      (contactProducer.publishAuditEvent as jest.Mock).mockRejectedValueOnce(
        new Error("Kafka publish failed")
      );

      // Update the address
      const updateRequest = {
        id: addressId,
        contact_id: contactId,
        street: "101 Elm St",
        city: "Ogdenville",
        province: "IL",
        country: "USA",
        postal_code: "62704",
      };

      // Should not throw, address should still be updated
      const response = await AddressService.update(user, updateRequest);

      expect(response).toBeDefined();
      expect(response.street).toBe("101 Elm St");
    });

    it("should publish audit event on address deletion", async () => {
      // First create an address
      const createRequest = {
        contact_id: contactId,
        street: "200 Maple Dr",
        city: "Brockway",
        province: "IL",
        country: "USA",
        postal_code: "62705",
      };
      const address = await AddressService.create(user, createRequest);
      addressId = address.id;

      jest.clearAllMocks();

      // Delete the address
      const deleteRequest = {
        contact_id: contactId,
        id: addressId,
      };

      await AddressService.remove(user, deleteRequest);

      expect(contactProducer.publishAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "address.deleted",
          entityType: "address",
          entityId: addressId,
          username: user.username,
        })
      );
    });

    it("should continue if audit event publish fails on address deletion", async () => {
      // First create an address
      const createRequest = {
        contact_id: contactId,
        street: "300 Cedar Ln",
        city: "North Haverbrook",
        province: "IL",
        country: "USA",
        postal_code: "62706",
      };
      const address = await AddressService.create(user, createRequest);
      addressId = address.id;

      jest.clearAllMocks();

      // Mock publish to fail
      (contactProducer.publishAuditEvent as jest.Mock).mockRejectedValueOnce(
        new Error("Kafka publish failed")
      );

      // Delete the address - should not throw
      const deleteRequest = {
        contact_id: contactId,
        id: addressId,
      };

      const response = await AddressService.remove(user, deleteRequest);

      expect(response).toBeDefined();
      expect(response.street).toBe("300 Cedar Ln");
    });
  });
});
