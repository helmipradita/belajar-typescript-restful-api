import {NextFunction, Request, Response} from "express";
import {v4 as uuid} from "uuid";

declare global {
    namespace Express {
        interface Request {
            requestId: string;
        }
    }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const header = req.header("x-request-id");
    req.requestId = header && header.length > 0 ? header : uuid();
    res.setHeader("x-request-id", req.requestId);
    next();
};
