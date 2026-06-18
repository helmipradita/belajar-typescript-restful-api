import express from "express";
import {UserController} from "../controllers/user-controller";
import {MonitoringController} from "../controllers/monitoring-controller";
import {authLimiter} from "../middleware/rate-limit-middleware";

export const publicRouter = express.Router();

// Infrastructure — skip global rate limit via skip list
publicRouter.get("/healthz", MonitoringController.liveness);
publicRouter.get("/health", MonitoringController.health);
publicRouter.get("/metrics", MonitoringController.metrics);

// Auth — dilindungi authLimiter (strict, per-IP)
publicRouter.use("/users", authLimiter);
publicRouter.post("/users", UserController.register);
publicRouter.post("/users/login", UserController.login);
publicRouter.post("/users/refresh", UserController.refresh);
