import {NextFunction, Request, Response} from "express";
import {logger} from "../app/logging";

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();

    res.on("finish", () => {
        const latency = Number(process.hrtime.bigint() - start) / 1_000_000;

        logger.info({
            event: "request",
            request_id: req.requestId,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            latency_ms: latency,
            content_length: res.getHeader("content-length"),
            user_agent: req.get("User-Agent"),
        });
    });

    next();
};
