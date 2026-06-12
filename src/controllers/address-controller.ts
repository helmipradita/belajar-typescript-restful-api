import {UserRequest} from "../types/user-request";
import {Response, NextFunction} from "express";
import {
    CreateAddressRequest,
    GetAddressRequest,
    ListAddressRequest,
    RemoveAddressRequest,
    UpdateAddressRequest
} from "../models/address-model";
import {AddressService} from "../services/address-service";
import {HTTP, MESSAGE} from "../config/constants";

export class AddressController {

    static async create(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const request: CreateAddressRequest = {
                ...req.body,
                contact_id: Number(req.params.contactId)
            };

            const response = await AddressService.create(req.user!, request);
            res.status(HTTP.CREATED).json({
                data: response
            });
        } catch (e) {
            next(e);
        }
    }

    static async get(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const request: GetAddressRequest = {
                id: Number(req.params.addressId),
                contact_id: Number(req.params.contactId),
            }

            const response = await AddressService.get(req.user!, request);
            res.status(HTTP.OK).json({
                data: response
            });
        } catch (e) {
            next(e);
        }
    }

    static async update(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const request: UpdateAddressRequest = {
                ...req.body,
                contact_id: Number(req.params.contactId),
                id: Number(req.params.addressId)
            };

            const response = await AddressService.update(req.user!, request);
            res.status(HTTP.OK).json({
                data: response
            });
        } catch (e) {
            next(e);
        }
    }

    static async remove(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const request: RemoveAddressRequest = {
                id: Number(req.params.addressId),
                contact_id: Number(req.params.contactId),
            }

            await AddressService.remove(req.user!, request);
            res.status(HTTP.OK).json({
                data: MESSAGE.OK
            });
        } catch (e) {
            next(e);
        }
    }

    static async list(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const request: ListAddressRequest = {
                contact_id: Number(req.params.contactId),
                page: req.query.page ? Number(req.query.page) : 1,
                size: req.query.size ? Number(req.query.size) : 10,
            };
            const response = await AddressService.list(req.user!, request);
            res.status(HTTP.OK).json(response);
        } catch (e) {
            next(e);
        }
    }

}
