import {Response, NextFunction} from "express";
import {prismaClient} from "../app/database";
import {UserRequest} from "../types/user-request";
import {TokenService} from "../services/token-service";
import {HTTP, MESSAGE} from "../config/constants";

export const authMiddleware = async (req: UserRequest, res: Response, next: NextFunction) => {
    const authHeader = req.get('Authorization');
    const xApiToken = req.get('X-API-TOKEN');

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const payload = TokenService.verifyAccessToken(token);
            const user = await prismaClient.user.findUnique({
                where: {username: payload.username}
            });
            if (!user) {
                res.status(HTTP.UNAUTHORIZED).json({errors: [{message: MESSAGE.UNAUTHORIZED}]}).end();
                return;
            }
            req.user = user;
            next();
            return;
        } catch {
            res.status(HTTP.UNAUTHORIZED).json({errors: [{message: MESSAGE.UNAUTHORIZED}]}).end();
            return;
        }
    }

    if (xApiToken) {
        const user = await prismaClient.user.findFirst({
            where: {token: xApiToken}
        });

        if (user) {
            req.user = user;
            next();
            return;
        }
    }

    res.status(HTTP.UNAUTHORIZED).json({
        errors: [{message: MESSAGE.UNAUTHORIZED}]
    }).end();
}
