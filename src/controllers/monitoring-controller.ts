import {Request, Response} from "express";
import {prismaClient} from "../app/database";
import {metricsRegistry} from "../app/metrics";
import {HTTP, MESSAGE} from "../config/constants";

export class MonitoringController {
    static async liveness(req: Request, res: Response) {
        res.status(HTTP.OK).send(MESSAGE.OK);
    }

    static async health(req: Request, res: Response) {
        try {
            await prismaClient.$queryRaw`SELECT 1`;
            res.status(HTTP.OK).json({status: MESSAGE.HEALTHY});
        } catch {
            res.status(HTTP.SERVICE_UNAVAILABLE).json({
                status: MESSAGE.UNHEALTHY,
                errors: [{message: MESSAGE.DEPENDENCY_UNAVAILABLE}]
            });
        }
    }

    static async metrics(req: Request, res: Response) {
        res.set("Content-Type", metricsRegistry.contentType);
        res.end(await metricsRegistry.metrics());
    }
}
