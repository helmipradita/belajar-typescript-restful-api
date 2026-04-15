import express from "express";
import {publicRouter} from "../route/public-api";
import {errorMiddleware} from "../middleware/error-middleware";
import {apiRouter} from "../route/api";
import {healthRouter} from "../route/health-route";

export const web = express();
web.use(express.json());

// Health check routes (no auth required) - must be first
web.use(healthRouter);

// Public API routes (no auth required)
web.use(publicRouter);

// Protected API routes (auth required)
web.use(apiRouter);

// Error handling middleware (must be last)
web.use(errorMiddleware);
