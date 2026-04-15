import express from "express";
import { HealthController } from "../controller/health-controller";

export const healthRouter = express.Router();

// Health check endpoint - returns overall health status
// Does not require authentication
healthRouter.get("/health", HealthController.getHealth);

// Liveness probe - for Kubernetes/container orchestration
// Returns 200 if the process is running
healthRouter.get("/healthz", HealthController.getLiveness);

// Readiness probe - for Kubernetes/container orchestration
// Returns 200 if the service can accept traffic
healthRouter.get("/readyz", HealthController.getReadiness);
