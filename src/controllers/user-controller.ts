import {Request, Response, NextFunction} from "express";
import {CreateUserRequest, LoginUserRequest, RefreshTokenRequest, UpdateUserRequest} from "../models/user-model";
import {UserService} from "../services/user-service";
import {UserRequest} from "../types/user-request";
import {HTTP, MESSAGE} from "../config/constants";

export class UserController {

    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const request: CreateUserRequest = req.body as CreateUserRequest;
            const response = await UserService.register(request);
            res.status(HTTP.CREATED).json({
                data: response
            })
        } catch (e) {
            next(e);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const request: LoginUserRequest = req.body as LoginUserRequest;
            const response = await UserService.login(request);
            res.status(HTTP.OK).json({
                data: response
            })
        } catch (e) {
            next(e);
        }
    }

    static async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const request: RefreshTokenRequest = req.body as RefreshTokenRequest;
            const response = await UserService.refresh(request);
            res.status(HTTP.OK).json({
                data: response
            })
        } catch (e) {
            next(e);
        }
    }

    static async get(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const response = await UserService.get(req.user!);
            res.status(HTTP.OK).json({
                data: response
            })
        } catch (e) {
            next(e);
        }
    }

    static async update(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const request: UpdateUserRequest = req.body as UpdateUserRequest;
            const response = await UserService.update(req.user!, request);
            res.status(HTTP.OK).json({
                data: response
            })
        } catch (e) {
            next(e);
        }
    }

    static async logout(req: UserRequest, res: Response, next: NextFunction) {
        try {
            await UserService.logout(req.user!);
            res.status(HTTP.OK).json({
                data: MESSAGE.OK
            })
        } catch (e) {
            next(e);
        }
    }

}
