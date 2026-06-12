import jwt, {SignOptions} from "jsonwebtoken";
import type {StringValue} from "ms";
import {v4 as uuid} from "uuid";
import {prismaClient} from "../app/database";
import {env} from "../config/env";
import {ResponseError} from "../errors/response-error";
import {TokenResponse} from "../models/user-model";
import {MESSAGE, HTTP} from "../config/constants";

export type JwtPayload = {
    username: string;
    name: string;
};

export class TokenService {

    static generateAccessToken(payload: JwtPayload): string {
        const options: SignOptions = {expiresIn: env.JWT_ACCESS_EXPIRES_IN as StringValue};
        return jwt.sign(payload, env.JWT_SECRET, options);
    }

    static verifyAccessToken(token: string): JwtPayload {
        return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    }

    static async generateRefreshToken(username: string): Promise<string> {
        const refreshToken = uuid();

        await prismaClient.user.update({
            where: {username},
            data: {token: refreshToken}
        });

        return refreshToken;
    }

    static async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
        const user = await prismaClient.user.findFirst({
            where: {token: refreshToken}
        });

        if (!user) {
            throw new ResponseError(HTTP.UNAUTHORIZED, MESSAGE.INVALID_REFRESH_TOKEN);
        }

        const access_token = this.generateAccessToken({
            username: user.username,
            name: user.name
        });

        const refresh_token = await this.generateRefreshToken(user.username);

        return {access_token, refresh_token};
    }

}
