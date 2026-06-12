import express from "express";
import {UserController} from "../controllers/user-controller";
import {MonitoringController} from "../controllers/monitoring-controller";

export const publicRouter = express.Router();
publicRouter.get("/healthz", MonitoringController.liveness);
publicRouter.get("/health", MonitoringController.health);
publicRouter.get("/metrics", MonitoringController.metrics);
publicRouter.post("/users", UserController.register);
publicRouter.post("/users/login", UserController.login);
publicRouter.post("/users/refresh", UserController.refresh);
