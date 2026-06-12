import "../config/env";
import express from "express";
import {publicRouter} from "../routes/public-api";
import {errorMiddleware} from "../middleware/error-middleware";
import {apiRouter} from "../routes/api";
import {requestIdMiddleware} from "../middleware/request-id-middleware";
import {requestLoggerMiddleware} from "../middleware/request-logger-middleware";
import {metricsMiddleware} from "../middleware/metrics-middleware";

export const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
app.use(metricsMiddleware);
app.use("/api/v1", publicRouter);
app.use("/api/v1", apiRouter);
app.use(errorMiddleware);
