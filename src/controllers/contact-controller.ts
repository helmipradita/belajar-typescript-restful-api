import {UserRequest} from "../types/user-request";
import {Response, NextFunction} from "express";
import {CreateContactRequest, SearchContactRequest, UpdateContactRequest} from "../models/contact-model";
import {ContactService} from "../services/contact-service";
import {HTTP, MESSAGE} from "../config/constants";

export class ContactController {

    static async create(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const request: CreateContactRequest = req.body as CreateContactRequest;
            const response = await ContactService.create(req.user!, request);
            res.status(HTTP.CREATED).json({
                data: response
            });
        } catch (e) {
            next(e);
        }
    }

    static async get(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const contactId = Number(req.params.contactId);
            const response = await ContactService.get(req.user!, contactId);
            res.status(HTTP.OK).json({
                data: response
            });
        } catch (e) {
            next(e);
        }
    }

    static async update(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const request: UpdateContactRequest = {
                ...req.body,
                id: Number(req.params.contactId)
            };

            const response = await ContactService.update(req.user!, request);
            res.status(HTTP.OK).json({
                data: response
            });
        } catch (e) {
            next(e);
        }
    }

    static async remove(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const contactId = Number(req.params.contactId);
            await ContactService.remove(req.user!, contactId);
            res.status(HTTP.OK).json({
                data: MESSAGE.OK
            });
        } catch (e) {
            next(e);
        }
    }

    static async search(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const request: SearchContactRequest = {
                name: req.query.name as string,
                email: req.query.email as string,
                phone: req.query.phone as string,
                page: req.query.page ? Number(req.query.page) : 1,
                size: req.query.size ? Number(req.query.size) : 10,
            }
            const response = await ContactService.search(req.user!, request);
            res.status(HTTP.OK).json(response);
        } catch (e) {
            next(e);
        }
    }

}
