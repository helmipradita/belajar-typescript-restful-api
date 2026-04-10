import { Producer, Partitioners } from "kafkajs";
import { kafka, kafkaTopics, type KafkaTopic } from "../application/kafka";
import { logger } from "../application/logging";
import { AuditEvent } from "../model/audit-model";

export class ContactProducer {
  private producer: Producer;
  private isConnecting: boolean = false;
  private isConnected: boolean = false;

  constructor() {
    this.producer = kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
    });
  }

  async start(): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    try {
      await this.producer.connect();
      this.isConnected = true;
      logger.info("Kafka Producer connected");
    } catch (error) {
      logger.error(`Failed to connect Kafka Producer: ${error}`);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async publishAuditEvent(event: AuditEvent): Promise<void> {
    if (!this.isConnected) {
      logger.warn(`Producer not connected, skipping event publish: ${event.type}`);
      return;
    }

    try {
      const topic: KafkaTopic =
        event.entityType === "contact" ? kafkaTopics.CONTACT_AUDIT : kafkaTopics.ADDRESS_AUDIT;

      await this.producer.send({
        topic,
        messages: [
          {
            key: event.username,
            value: JSON.stringify(event),
            timestamp: event.timestamp ? event.timestamp.toString() : Date.now().toString(),
          },
        ],
      });

      logger.debug(`Audit event published: ${event.type} for entity ${event.entityId}`);
    } catch (error) {
      // Log error but don't throw - we don't want to affect API response time
      logger.error(`Failed to publish audit event: ${error}`);
    }
  }

  async shutdown(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.producer.disconnect();
      this.isConnected = false;
      logger.info("Kafka Producer disconnected");
    } catch (error) {
      logger.error(`Error during Kafka Producer shutdown: ${error}`);
      // Ensure isConnected is set to false even on error
      this.isConnected = false;
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
export const contactProducer = new ContactProducer();
