import {Response, Request, NextFunction} from "express";
import {ZodError} from "zod";
import {Prisma} from "@prisma/client";
import {ResponseError} from "../errors/response-error";
import {HTTP, MESSAGE} from "../config/constants";
import {env} from "../config/env";
import {logger} from "../app/logging";

export const errorMiddleware = async (error: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({
        event: "error",
        type: error.constructor.name,
        message: error.message,
        stack: env.NODE_ENV === "development" ? error.stack : undefined,
        request_id: (req as any).requestId,
        method: req.method,
        path: req.path,
    });

    if (error instanceof ZodError) {
        res.status(HTTP.BAD_REQUEST).json({
            errors: error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
            })),
        });
    } else if (error instanceof ResponseError) {
        res.status(error.status).json({
            errors: [{message: error.message}]
        });
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case "P2002":
                res.status(HTTP.CONFLICT).json({
                    errors: [{message: MESSAGE.RESOURCE_EXISTS}]
                });
                break;
            case "P2025":
                res.status(HTTP.NOT_FOUND).json({
                    errors: [{message: MESSAGE.RESOURCE_NOT_FOUND}]
                });
                break;
            default:
                res.status(HTTP.BAD_REQUEST).json({
                    errors: [{message: MESSAGE.DATABASE_ERROR}]
                });
        }
    } else {
        res.status(HTTP.INTERNAL_SERVER_ERROR).json({
            errors: [{message: env.NODE_ENV === "production"
                ? MESSAGE.INTERNAL_SERVER_ERROR
                : error.message}]
        });
    }
}
