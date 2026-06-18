import "../config/env";
import express from "express";
import cors from "cors";
import compression from "compression";
import {publicRouter} from "../routes/public-api";
import {errorMiddleware} from "../middleware/error-middleware";
import {apiRouter} from "../routes/api";
import {requestIdMiddleware} from "../middleware/request-id-middleware";
import {requestLoggerMiddleware} from "../middleware/request-logger-middleware";
import {metricsMiddleware} from "../middleware/metrics-middleware";
import {globalLimiter} from "../middleware/rate-limit-middleware";
import {env} from "../config/env";

export const app = express();
app.use(express.json({ limit: env.BODY_LIMIT }));
app.use(compression());
app.use(cors({
    origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(","),
    credentials: true
}));
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
app.use(metricsMiddleware);
app.use(globalLimiter);
app.use("/api/v1", publicRouter);
app.use("/api/v1", apiRouter);
app.use(errorMiddleware);
