import { Consumer, EachMessagePayload } from "kafkajs";
import { kafka, kafkaTopics } from "../application/kafka";
import { prismaClient } from "../application/database";
import { logger } from "../application/logging";
import { AuditEvent } from "../model/audit-model";

export class AuditConsumer {
  private consumer: Consumer;
  private isRunning: boolean = false;
  private isConnected: boolean = false;

  constructor(groupId: string = "audit-service") {
    this.consumer = kafka.consumer({ groupId });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn("Audit consumer is already running");
      return;
    }

    try {
      await this.consumer.connect();
      this.isConnected = true;
      logger.info("Kafka Consumer connected");

      // Subscribe to both topics
      await this.consumer.subscribe({
        topics: [kafkaTopics.CONTACT_AUDIT, kafkaTopics.ADDRESS_AUDIT],
        fromBeginning: false,
      });

      this.isRunning = true;

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.processMessage(payload);
        },
      });

      logger.info("Audit consumer started successfully");
    } catch (error) {
      this.isRunning = false;
      logger.error(`Failed to start audit consumer: ${error}`);
      throw error;
    }
  }

  private async processMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      if (!message.value) {
        logger.warn(`Received message with no value from topic ${topic}, partition ${partition}`);
        return;
      }

      const event: AuditEvent = JSON.parse(message.value.toString());

      logger.debug(
        `Processing audit event: ${event.type} for ${event.entityType} ${event.entityId} by ${event.username}`
      );

      // Save to database
      await prismaClient.auditLog.create({
        data: {
          eventType: event.type,
          entityType: event.entityType,
          entityId: event.entityId,
          username: event.username,
          timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
          oldValue: event.oldValue,
          newValue: event.newValue,
        },
      });

      logger.info(`Audit log saved: ${event.type} for ${event.entityType} ${event.entityId}`);
    } catch (error) {
      logger.error(
        `Failed to process audit message from topic ${topic}, partition ${partition}, offset ${message.offset}: ${error}`
      );
      // Don't throw - we want to continue processing other messages
    }
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    try {
      await this.consumer.stop();
      await this.consumer.disconnect();
      this.isConnected = false;
      logger.info("Audit consumer stopped gracefully");
    } catch (error) {
      logger.error(`Error during audit consumer shutdown: ${error}`);
    }
  }

  isActive(): boolean {
    return this.isRunning;
  }
}
