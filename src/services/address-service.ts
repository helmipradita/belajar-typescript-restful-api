import {Address, User} from "@prisma/client";
import {
    AddressResponse,
    CreateAddressRequest,
    GetAddressRequest,
    ListAddressRequest,
    RemoveAddressRequest,
    toAddressResponse,
    UpdateAddressRequest
} from "../models/address-model";
import {Validation} from "../validations/validation";
import {AddressValidation} from "../validations/address-validation";
import {ContactService} from "./contact-service";
import {prismaClient} from "../app/database";
import {ResponseError} from "../errors/response-error";
import {Pageable} from "../models/page";
import {HTTP, MESSAGE} from "../config/constants";

export class AddressService {

    static async create(user: User, request: CreateAddressRequest): Promise<AddressResponse> {
        const createRequest = Validation.validate(AddressValidation.CREATE, request);
        await ContactService.checkContactMustExists(user.username, request.contact_id);

        const address = await prismaClient.address.create({
            data: createRequest
        });

        return toAddressResponse(address);
    }

    static async checkAddressMustExists(contactId: number, addressId: number): Promise<Address> {
        const address = await prismaClient.address.findFirst({
            where: {
                id: addressId,
                contact_id: contactId,
            }
        });

        if (!address) {
            throw new ResponseError(HTTP.NOT_FOUND, MESSAGE.ADDRESS_NOT_FOUND);
        }

        return address;
    }

    static async get(user: User, request: GetAddressRequest): Promise<AddressResponse> {
        const getRequest = Validation.validate(AddressValidation.GET, request);
        await ContactService.checkContactMustExists(user.username, request.contact_id);
        const address = await this.checkAddressMustExists(getRequest.contact_id, getRequest.id);

        return toAddressResponse(address);
    }

    static async update(user: User, request: UpdateAddressRequest): Promise<AddressResponse> {
        const updateRequest = Validation.validate(AddressValidation.UPDATE, request);
        await ContactService.checkContactMustExists(user.username, request.contact_id);
        await this.checkAddressMustExists(updateRequest.contact_id, updateRequest.id);

        const {id, contact_id, ...updateData} = updateRequest;

        const address = await prismaClient.address.update({
            where: {
                id: id,
                contact_id: contact_id
            },
            data: updateData
        })

        return toAddressResponse(address);
    }

    static async remove(user: User, request: RemoveAddressRequest): Promise<AddressResponse> {
        const removeRequest = Validation.validate(AddressValidation.REMOVE, request);
        await ContactService.checkContactMustExists(user.username, removeRequest.contact_id);
        await this.checkAddressMustExists(removeRequest.contact_id, removeRequest.id);

        const address = await prismaClient.address.delete({
            where: {
                id: removeRequest.id,
                contact_id: removeRequest.contact_id
            }
        });

        return toAddressResponse(address);
    }

    static async list(user: User, request: ListAddressRequest): Promise<Pageable<AddressResponse>> {
        await ContactService.checkContactMustExists(user.username, request.contact_id);

        const skip = (request.page - 1) * request.size;

        const [addresses, total] = await prismaClient.$transaction([
            prismaClient.address.findMany({
                where: {
                    contact_id: request.contact_id,
                },
                take: request.size,
                skip: skip
            }),
            prismaClient.address.count({
                where: {
                    contact_id: request.contact_id,
                }
            })
        ]);

        return {
            data: addresses.map((address) => toAddressResponse(address)),
            paging: {
                current_page: request.page,
                total_page: Math.ceil(total / request.size),
                size: request.size
            }
        }
    }

}
