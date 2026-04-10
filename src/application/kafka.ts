import { Kafka } from "kafkajs";
import { logger } from "./logging";

const kafkaBrokers = process.env.KAFKA_BROKERS || "localhost:9093";

export const kafka = new Kafka({
  clientId: "contact-api",
  brokers: kafkaBrokers.split(",").map((b) => b.trim()),
  logLevel: process.env.NODE_ENV === "development" ? 2 : 0, // INFO level for dev, NOTHING for prod
});

export const kafkaTopics = {
  CONTACT_AUDIT: "contact.audit",
  ADDRESS_AUDIT: "address.audit",
} as const;

export type KafkaTopic = (typeof kafkaTopics)[keyof typeof kafkaTopics];

// Verify Kafka connection on startup
export async function verifyKafkaConnection(): Promise<boolean> {
  try {
    const admin = kafka.admin();
    await admin.connect();
    await admin.disconnect();
    logger.info(`Kafka connection verified. Brokers: ${kafkaBrokers}`);
    return true;
  } catch (error) {
    logger.error(`Failed to connect to Kafka: ${error}`);
    return false;
  }
}
