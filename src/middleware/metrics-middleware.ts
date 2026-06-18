import {NextFunction, Request, Response} from "express";
import {httpRequestDurationSeconds, httpRequestTotal} from "../app/metrics";

const getRouteLabel = (req: Request): string => {
    if (req.route?.path) {
        return `${req.baseUrl}${req.route.path}`;
    }

    return "UNMATCHED";
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (req.path.endsWith("/metrics")) {
        next();
        return;
    }

    const start = process.hrtime.bigint();

    res.on("finish", () => {
        const duration = Number(process.hrtime.bigint() - start) / 1_000_000_000;
        const labels = {
            method: req.method,
            route: getRouteLabel(req),
            status: String(res.statusCode)
        };

        httpRequestTotal.inc(labels);
        httpRequestDurationSeconds.observe(labels, duration);
    });

    next();
};
