import express from "express";
import { prismaClient } from "../application/database";
import { getRedisClient } from "../application/redis";
import { contactProducer } from "../producer/contact-producer";
import { logger } from "../application/logging";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  checks: {
    database: { status: "up" | "down"; latency?: number };
    redis: { status: "up" | "down"; latency?: number };
    kafka: { status: "up" | "down" | "disabled" };
  };
}

class HealthController {
  static async getHealth(req: express.Request, res: express.Response) {
    const startTime = Date.now();
    const checks: HealthStatus["checks"] = {
      database: { status: "down" },
      redis: { status: "down" },
      kafka: { status: "disabled" },
    };

    let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
    let downCount = 0;

    // Check Database
    try {
      const dbStart = Date.now();
      await prismaClient.$queryRaw`SELECT 1`;
      checks.database = { status: "up", latency: Date.now() - dbStart };
    } catch (error) {
      checks.database = { status: "down" };
      downCount++;
    }

    // Check Redis
    try {
      const redisClient = getRedisClient();
      if (redisClient?.isOpen) {
        const redisStart = Date.now();
        await redisClient.ping();
        checks.redis = { status: "up", latency: Date.now() - redisStart };
      } else {
        checks.redis = { status: "down" };
        downCount++;
      }
    } catch (error) {
      checks.redis = { status: "down" };
      downCount++;
    }

    // Check Kafka Producer
    try {
      if (contactProducer.isReady()) {
        checks.kafka = { status: "up" };
      } else {
        checks.kafka = { status: "down" };
        downCount++;
      }
    } catch (error) {
      checks.kafka = { status: "down" };
      downCount++;
    }

    // Determine overall status
    if (downCount === 0) {
      overallStatus = "healthy";
    } else if (downCount < 2) {
      overallStatus = "degraded";
    } else {
      overallStatus = "unhealthy";
    }

    const response: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    };

    // Return appropriate status code
    const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

    return res.status(statusCode).json(response);
  }

  static async getLiveness(req: express.Request, res: express.Response) {
    // Liveness probe - just check if server is responsive
    // Used by Kubernetes/container orchestration to restart if not responding
    res.status(200).json({ status: "alive" });
  }

  static async getReadiness(req: express.Request, res: express.Response) {
    // Readiness probe - check if service can accept traffic
    // Used by Kubernetes/container orchestration to stop routing traffic

    // Basic check: is the process running?
    const isReady = true; // Can be enhanced with more checks

    if (isReady) {
      res.status(200).json({ status: "ready" });
    } else {
      res.status(503).json({ status: "not ready" });
    }
  }
}

export { HealthController };
