import {Address, User} from "@prisma/client";
import {
    AddressResponse,
    CreateAddressRequest,
    GetAddressRequest, RemoveAddressRequest,
    toAddressResponse,
    UpdateAddressRequest
} from "../model/address-model";
import {Validation} from "../validation/validation";
import {AddressValidation} from "../validation/address-validation";
import {ContactService} from "./contact-service";
import {prismaClient} from "../application/database";
import {ResponseError} from "../error/response-error";
import {contactProducer} from "../producer/contact-producer";
import {createAddressAuditEvent} from "../model/audit-model";

export class AddressService {

    static async create(user: User, request: CreateAddressRequest): Promise<AddressResponse> {
        const createRequest = Validation.validate(AddressValidation.CREATE, request);
        await ContactService.checkContactMustExists(user.username, request.contact_id);

        const address = await prismaClient.address.create({
            data: createRequest
        });

        // Publish audit event (non-blocking)
        const auditEvent = createAddressAuditEvent(
            "address.created",
            address.id,
            user.username,
            undefined,
            address
        );
        contactProducer.publishAuditEvent(auditEvent).catch(err =>
            console.error("Failed to publish audit event:", err)
        );

        return toAddressResponse(address);
    }

    static async checkAddressMustExists(contactId: number, addressId: number): Promise<Address> {
        const address = await prismaClient.address.findFirst({
            where: {
                id: addressId,
                contact_id: contactId
            }
        });

        if (!address) {
            throw new ResponseError(404, "Address is not found");
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
        const existingAddress = await this.checkAddressMustExists(updateRequest.contact_id, updateRequest.id);

        const address = await prismaClient.address.update({
            where: {
                id: updateRequest.id,
                contact_id: updateRequest.contact_id
            },
            data: updateRequest
        });

        // Publish audit event (non-blocking)
        const auditEvent = createAddressAuditEvent(
            "address.updated",
            address.id,
            user.username,
            existingAddress,
            address
        );
        contactProducer.publishAuditEvent(auditEvent).catch(err =>
            console.error("Failed to publish audit event:", err)
        );

        return toAddressResponse(address);
    }

    static async remove(user: User, request: RemoveAddressRequest): Promise<AddressResponse> {
        const removeRequest = Validation.validate(AddressValidation.GET, request);
        await ContactService.checkContactMustExists(user.username, request.contact_id);
        const existingAddress = await this.checkAddressMustExists(removeRequest.contact_id, removeRequest.id);

        const address = await prismaClient.address.delete({
            where: {
                id: removeRequest.id
            }
        });

        // Publish audit event (non-blocking)
        const auditEvent = createAddressAuditEvent(
            "address.deleted",
            address.id,
            user.username,
            existingAddress,
            undefined
        );
        contactProducer.publishAuditEvent(auditEvent).catch(err =>
            console.error("Failed to publish audit event:", err)
        );

        return toAddressResponse(address);
    }

    static async list(user: User, contactId: number): Promise<Array<AddressResponse>> {
        await ContactService.checkContactMustExists(user.username, contactId);

        const addresses = await prismaClient.address.findMany({
            where:{
                contact_id: contactId
            }
        });

        return addresses.map((address) => toAddressResponse(address));
    }

}
