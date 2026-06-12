import {AddressTest, ContactTest, UserTest} from "../test-util";
import supertest from "supertest";
import {app} from "../../src/app/app";
import {logger} from "../../src/app/logging";

describe('POST /api/v1/contacts/:contactId/addresses', () => {
    beforeEach(async () => {
        await UserTest.create();
        await ContactTest.create();
    })
    afterEach(async () => {
        await AddressTest.deleteAll();
        await ContactTest.deleteAll();
        await UserTest.delete();
    })

    it('should be able to create address', async () => {
        const contact = await ContactTest.get();
        const response = await supertest(app)
            .post(`/api/v1/contacts/${contact.id}/addresses`)
            .set("X-API-TOKEN", "test")
            .send({
                street: "Jalan belum ada",
                city: "Jakarta",
                province: "DKI Jakarta",
                country: "Indonesia",
                postal_code: "11111"
            });

        logger.debug(response.body);
        expect(response.status).toBe(201);
        expect(response.body.data.id).toBeDefined();
        expect(response.body.data.street).toBe("Jalan belum ada")
        expect(response.body.data.city).toBe("Jakarta")
        expect(response.body.data.province).toBe("DKI Jakarta")
        expect(response.body.data.country).toBe("Indonesia")
        expect(response.body.data.postal_code).toBe("11111")
    });

    it('should reject create new address if request is invalid', async () => {
        const contact = await ContactTest.get();
        const response = await supertest(app)
            .post(`/api/v1/contacts/${contact.id}/addresses`)
            .set("X-API-TOKEN", "test")
            .send({
                street: "Jalan belum ada",
                city: "Jakarta",
                province: "DKI Jakarta",
                country: "",
                postal_code: ""
            });

        logger.debug(response.body);
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
    });

    it('should reject create new address if contact is not found', async () => {
        const contact = await ContactTest.get();
        const response = await supertest(app)
            .post(`/api/v1/contacts/${contact.id + 1}/addresses`)
            .set("X-API-TOKEN", "test")
            .send({
                street: "Jalan belum ada",
                city: "Jakarta",
                province: "DKI Jakarta",
                country: "Indonesia",
                postal_code: "11111"
            });

        logger.debug(response.body);
        expect(response.status).toBe(404);
        expect(response.body.errors).toBeDefined();
    });
});

describe('GET /api/v1/contacts/:contactId/addresses/:addressId', () => {
    beforeEach(async () => {
        await UserTest.create();
        await ContactTest.create();
        await AddressTest.create();
    })
    afterEach(async () => {
        await AddressTest.deleteAll();
        await ContactTest.deleteAll();
        await UserTest.delete();
    })

    it('should be able to get address', async () => {
        const contact = await ContactTest.get();
        const address = await AddressTest.get();

        const response = await supertest(app)
            .get(`/api/v1/contacts/${contact.id}/addresses/${address.id}`)
            .set("X-API-TOKEN", "test");

        logger.debug(response.body);
        expect(response.status).toBe(200);
        expect(response.body.data.id).toBeDefined()
        expect(response.body.data.street).toBe(address.street);
        expect(response.body.data.city).toBe(address.city);
        expect(response.body.data.province).toBe(address.province);
        expect(response.body.data.country).toBe(address.country);
        expect(response.body.data.postal_code).toBe(address.postal_code);
    });

    it('should reject get address if address is not found', async () => {
        const contact = await ContactTest.get();
        const address = await AddressTest.get();

        const response = await supertest(app)
            .get(`/api/v1/contacts/${contact.id}/addresses/${address.id + 1}`)
            .set("X-API-TOKEN", "test");

        logger.debug(response.body);
        expect(response.status).toBe(404);
        expect(response.body.errors).toBeDefined()
    });

    it('should reject get address if contact is not found', async () => {
        const contact = await ContactTest.get();
        const address = await AddressTest.get();

        const response = await supertest(app)
            .get(`/api/v1/contacts/${contact.id + 1}/addresses/${address.id}`)
            .set("X-API-TOKEN", "test");

        logger.debug(response.body);
        expect(response.status).toBe(404);
        expect(response.body.errors).toBeDefined()
    });
});

describe('PUT /api/v1/contacts/:contactId/addresses/:addressId', () => {
    beforeEach(async () => {
        await UserTest.create();
        await ContactTest.create();
        await AddressTest.create();
    })
    afterEach(async () => {
        await AddressTest.deleteAll();
        await ContactTest.deleteAll();
        await UserTest.delete();
    })

    it('should be able to update address', async () => {
        const contact = await ContactTest.get();
        const address = await AddressTest.get();

        const response = await supertest(app)
            .put(`/api/v1/contacts/${contact.id}/addresses/${address.id}`)
            .set("X-API-TOKEN", "test")
            .send({
                street: "Jalan belum ada",
                city: "Jakarta",
                province: "DKI Jakarta",
                country: "Indonesia",
                postal_code: "11111"
            })

        logger.debug(response.body);
        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(address.id);
        expect(response.body.data.street).toBe("Jalan belum ada")
        expect(response.body.data.city).toBe("Jakarta")
        expect(response.body.data.province).toBe("DKI Jakarta")
        expect(response.body.data.country).toBe("Indonesia")
        expect(response.body.data.postal_code).toBe("11111")
    });

    it('should reject update address if data is invalid', async () => {
        const contact = await ContactTest.get();
        const address = await AddressTest.get();

        const response = await supertest(app)
            .put(`/api/v1/contacts/${contact.id}/addresses/${address.id}`)
            .set("X-API-TOKEN", "test")
            .send({
                street: "Jalan belum ada",
                city: "Jakarta",
                province: "DKI Jakarta",
                country: "",
                postal_code: ""
            })

        logger.debug(response.body);
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
    });

    it('should reject update address if address is not found', async () => {
        const contact = await ContactTest.get();
        const address = await AddressTest.get();

        const response = await supertest(app)
            .put(`/api/v1/contacts/${contact.id}/addresses/${address.id + 1}`)
            .set("X-API-TOKEN", "test")
            .send({
                street: "Jalan belum ada",
                city: "Jakarta",
                province: "DKI Jakarta",
                country: "Indonesia",
                postal_code: "1111"
            })

        logger.debug(response.body);
        expect(response.status).toBe(404);
        expect(response.body.errors).toBeDefined();
    });

    it('should reject update address if contact is not found', async () => {
        const contact = await ContactTest.get();
        const address = await AddressTest.get();

        const response = await supertest(app)
            .put(`/api/v1/contacts/${contact.id + 1}/addresses/${address.id}`)
            .set("X-API-TOKEN", "test")
            .send({
                street: "Jalan belum ada",
                city: "Jakarta",
                province: "DKI Jakarta",
                country: "Indonesia",
                postal_code: "1111"
            })

        logger.debug(response.body);
        expect(response.status).toBe(404);
        expect(response.body.errors).toBeDefined();
    });
});

describe('DELETE /api/v1/contacts/:contactId/addresses/:addressId', () => {
    beforeEach(async () => {
        await UserTest.create();
        await ContactTest.create();
        await AddressTest.create();
    })
    afterEach(async () => {
        await AddressTest.deleteAll();
        await ContactTest.deleteAll();
        await UserTest.delete();
    })

    it('should be able to remove address', async () => {
        const contact = await ContactTest.get();
        const address = await AddressTest.get();

        const response = await supertest(app)
            .delete(`/api/v1/contacts/${contact.id}/addresses/${address.id}`)
            .set("X-API-TOKEN", "test");

        logger.debug(response.body);
        expect(response.status).toBe(200);
        expect(response.body.data).toBe("OK");
    });

    it('should reject remove address if address is not found', async () => {
        const contact = await ContactTest.get();
        const address = await AddressTest.get();

        const response = await supertest(app)
            .delete(`/api/v1/contacts/${contact.id}/addresses/${address.id + 1}`)
            .set("X-API-TOKEN", "test");

        logger.debug(response.body);
        expect(response.status).toBe(404);
        expect(response.body.errors).toBeDefined();
    });

    it('should reject remove address if contact is not found', async () => {
        const contact = await ContactTest.get();
        const address = await AddressTest.get();

        const response = await supertest(app)
            .delete(`/api/v1/contacts/${contact.id + 1}/addresses/${address.id}`)
            .set("X-API-TOKEN", "test");

        logger.debug(response.body);
        expect(response.status).toBe(404);
        expect(response.body.errors).toBeDefined();
    });
});

describe('GET /api/v1/contacts/:contactId/addresses', () => {
    beforeEach(async () => {
        await UserTest.create();
        await ContactTest.create();
        await AddressTest.create();
    })
    afterEach(async () => {
        await AddressTest.deleteAll();
        await ContactTest.deleteAll();
        await UserTest.delete();
    })

    it('should be able to list addresses with pagination', async () => {
        const contact = await ContactTest.get();

        const response = await supertest(app)
            .get(`/api/v1/contacts/${contact.id}/addresses`)
            .set("X-API-TOKEN", "test");

        logger.debug(response.body);
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(1);
        expect(response.body.paging.current_page).toBe(1);
        expect(response.body.paging.total_page).toBe(1);
        expect(response.body.paging.size).toBe(10);
    });

    it('should reject list address if contact is not found', async () => {
        const contact = await ContactTest.get();

        const response = await supertest(app)
            .get(`/api/v1/contacts/${contact.id + 1}/addresses`)
            .set("X-API-TOKEN", "test");

        logger.debug(response.body);
        expect(response.status).toBe(404);
        expect(response.body.errors).toBeDefined();
    });
});
