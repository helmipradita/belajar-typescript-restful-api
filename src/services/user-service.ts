import {
    CreateUserRequest,
    LoginUserRequest,
    RefreshTokenRequest,
    TokenResponse,
    toUserResponse,
    UpdateUserRequest,
    UserResponse
} from "../models/user-model";
import {Validation} from "../validations/validation";
import {UserValidation} from "../validations/user-validation";
import {prismaClient} from "../app/database";
import {ResponseError} from "../errors/response-error";
import bcrypt from "bcrypt";
import {User} from "@prisma/client";
import {TokenService} from "./token-service";
import {HTTP, MESSAGE} from "../config/constants";

export class UserService {

    static async register(request: CreateUserRequest): Promise<UserResponse> {
        const registerRequest = Validation.validate(UserValidation.REGISTER, request);

        const totalUserWithSameUsername = await prismaClient.user.count({
            where: {
                username: registerRequest.username
            }
        });

        if (totalUserWithSameUsername != 0) {
            throw new ResponseError(HTTP.BAD_REQUEST, MESSAGE.USERNAME_EXISTS);
        }

        registerRequest.password = await bcrypt.hash(registerRequest.password, 10);

        const user = await prismaClient.user.create({
            data: registerRequest
        });

        return toUserResponse(user);
    }

    static async login(request: LoginUserRequest): Promise<TokenResponse> {
        const loginRequest = Validation.validate(UserValidation.LOGIN, request);

        let user = await prismaClient.user.findUnique({
            where: {
                username: loginRequest.username
            }
        });

        if (!user) {
            throw new ResponseError(HTTP.UNAUTHORIZED, MESSAGE.WRONG_CREDENTIALS);
        }

        const isPasswordValid = await bcrypt.compare(loginRequest.password, user.password);
        if (!isPasswordValid) {
            throw new ResponseError(HTTP.UNAUTHORIZED, MESSAGE.WRONG_CREDENTIALS);
        }

        const accessToken = TokenService.generateAccessToken({
            username: user.username,
            name: user.name
        });

        const refreshToken = await TokenService.generateRefreshToken(user.username);

        return {
            access_token: accessToken,
            refresh_token: refreshToken
        };
    }

    static async refresh(request: RefreshTokenRequest): Promise<TokenResponse> {
        const refreshRequest = Validation.validate(UserValidation.REFRESH, request);
        return TokenService.refreshAccessToken(refreshRequest.refresh_token);
    }

    static async get(user: User): Promise<UserResponse> {
        return toUserResponse(user);
    }

    static async update(user: User, request: UpdateUserRequest): Promise<UserResponse> {
        const updateRequest = Validation.validate(UserValidation.UPDATE, request);

        const data: {name?: string; password?: string} = {};
        if (updateRequest.name) {
            data.name = updateRequest.name;
        }
        if (updateRequest.password) {
            data.password = await bcrypt.hash(updateRequest.password, 10);
        }

        const result = await prismaClient.user.update({
            where: {
                username: user.username
            },
            data: data
        });

        return toUserResponse(result);
    }

    static async logout(user: User): Promise<UserResponse> {
        const result = await prismaClient.user.update({
            where: {
                username: user.username
            },
            data: {
                token: null
            }
        });

        return toUserResponse(result);
    }

}
