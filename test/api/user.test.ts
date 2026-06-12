import supertest from "supertest";
import {app} from "../../src/app/app";
import {logger} from "../../src/app/logging";
import {UserTest} from "../test-util";
import bcrypt from "bcrypt";

describe('POST /api/v1/users', () => {

    afterEach(async () => {
        await UserTest.delete();
    })

    it('should reject register new user if request is invalid', async () => {
        const response = await supertest(app)
            .post("/api/v1/users")
            .send({
                username: "",
                password: "",
                name: ""
            });

        logger.debug(response.body);
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
        expect(Array.isArray(response.body.errors)).toBe(true);
        expect(response.body.errors[0].message).toBeDefined();
    });

    it('should register new user', async () => {
        const response = await supertest(app)
            .post("/api/v1/users")
            .send({
                username: "test",
                password: "test",
                name: "test"
            });

        logger.debug(response.body);
        expect(response.status).toBe(201);
        expect(response.body.data.username).toBe("test");
        expect(response.body.data.name).toBe("test");
    });

    it('should reject register duplicate user', async () => {
        await UserTest.create();

        const response = await supertest(app)
            .post("/api/v1/users")
            .send({
                username: "test",
                password: "test",
                name: "test"
            });

        logger.debug(response.body);
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
        expect(Array.isArray(response.body.errors)).toBe(true);
        expect(response.body.errors[0].message).toBe("Username already exists");
    });

});

describe('POST /api/v1/users/login', () => {

    beforeEach(async () => {
        await UserTest.create();
    });

    afterEach(async () => {
        await UserTest.delete();
    });

    it('should be able to login', async () => {
        const response = await supertest(app)
            .post("/api/v1/users/login")
            .send({
                username: "test",
                password: "test"
            });

        logger.debug(response.body);
        expect(response.status).toBe(200);
        expect(response.body.data.access_token).toBeDefined();
        expect(response.body.data.refresh_token).toBeDefined();
    });

    it('should reject login user if username is wrong', async () => {
        const response = await supertest(app)
            .post("/api/v1/users/login")
            .send({
                username: "salah",
                password: "test"
            });

        logger.debug(response.body);
        expect(response.status).toBe(401);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe("Username or password is wrong");
    });

    it('should reject login user if password is wrong', async () => {
        const response = await supertest(app)
            .post("/api/v1/users/login")
            .send({
                username: "test",
                password: "salah"
            });

        logger.debug(response.body);
        expect(response.status).toBe(401);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe("Username or password is wrong");
    });

});

describe('POST /api/v1/users/refresh', () => {

    beforeEach(async () => {
        await UserTest.create();
    });

    afterEach(async () => {
        await UserTest.delete();
    });

    it('should be able to refresh token', async () => {
        const loginRes = await supertest(app)
            .post("/api/v1/users/login")
            .send({
                username: "test",
                password: "test"
            });

        const refreshToken = loginRes.body.data.refresh_token;

        const response = await supertest(app)
            .post("/api/v1/users/refresh")
            .send({
                refresh_token: refreshToken
            });

        logger.debug(response.body);
        expect(response.status).toBe(200);
        expect(response.body.data.access_token).toBeDefined();
        expect(response.body.data.refresh_token).toBeDefined();
        expect(response.body.data.refresh_token).not.toBe(refreshToken);
    });

    it('should reject refresh token if token is invalid', async () => {
        const response = await supertest(app)
            .post("/api/v1/users/refresh")
            .send({
                refresh_token: "invalid-uuid"
            });

        logger.debug(response.body);
        expect(response.status).toBe(401);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe("Invalid refresh token");
    });

});

describe('GET /api/v1/users/current', () => {
    beforeEach(async () => {
        await UserTest.create();
    });

    afterEach(async () => {
        await UserTest.delete();
    });

    it('should be able to get user with X-API-TOKEN', async () => {
        const response = await supertest(app)
            .get("/api/v1/users/current")
            .set("X-API-TOKEN", "test");

        logger.debug(response.body);
        expect(response.status).toBe(200);
        expect(response.body.data.username).toBe("test");
        expect(response.body.data.name).toBe("test");
    });

    it('should be able to get user with Bearer JWT', async () => {
        const loginRes = await supertest(app)
            .post("/api/v1/users/login")
            .send({
                username: "test",
                password: "test"
            });

        const accessToken = loginRes.body.data.access_token;

        const response = await supertest(app)
            .get("/api/v1/users/current")
            .set("Authorization", `Bearer ${accessToken}`);

        logger.debug(response.body);
        expect(response.status).toBe(200);
        expect(response.body.data.username).toBe("test");
    });

    it('should reject get user if token is invalid', async () => {
        const response = await supertest(app)
            .get("/api/v1/users/current")
            .set("X-API-TOKEN", "salah");

        logger.debug(response.body);
        expect(response.status).toBe(401);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe("Unauthorized");
    });

    it('should reject get user with invalid Bearer JWT', async () => {
        const response = await supertest(app)
            .get("/api/v1/users/current")
            .set("Authorization", "Bearer invalid.jwt.token");

        logger.debug(response.body);
        expect(response.status).toBe(401);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe("Unauthorized");
    });

    it('should reject get user without any token', async () => {
        const response = await supertest(app)
            .get("/api/v1/users/current");

        logger.debug(response.body);
        expect(response.status).toBe(401);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe("Unauthorized");
    });
});

describe('PATCH /api/v1/users/current', () => {
    beforeEach(async () => {
        await UserTest.create();
    });

    afterEach(async () => {
        await UserTest.delete();
    });

    it('should reject update user if request is invalid', async () => {
        const response = await supertest(app)
            .patch("/api/v1/users/current")
            .set("X-API-TOKEN", "test")
            .send({
                password: "",
                name: ""
            });

        logger.debug(response.body);
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
        expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should reject update user if token is wrong', async () => {
        const response = await supertest(app)
            .patch("/api/v1/users/current")
            .set("X-API-TOKEN", "salah")
            .send({
                password: "benar",
                name: "benar"
            });

        logger.debug(response.body);
        expect(response.status).toBe(401);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe("Unauthorized");
    });

    it('should be able to update user name', async () => {
        const response = await supertest(app)
            .patch("/api/v1/users/current")
            .set("X-API-TOKEN", "test")
            .send({
                name: "benar"
            });

        logger.debug(response.body);
        expect(response.status).toBe(200);
        expect(response.body.data.name).toBe("benar");
    });

    it('should be able to update user password', async () => {
        const response = await supertest(app)
            .patch("/api/v1/users/current")
            .set("X-API-TOKEN", "test")
            .send({
                password: "benar"
            });

        logger.debug(response.body);
        expect(response.status).toBe(200);

        const user = await UserTest.get();
        expect(await bcrypt.compare("benar", user.password)).toBe(true);
    });
});

describe('DELETE /api/v1/users/current', () => {
    beforeEach(async () => {
        await UserTest.create();
    });

    afterEach(async () => {
        await UserTest.delete();
    });

    it('should be able to logout', async () => {
        const response = await supertest(app)
            .delete("/api/v1/users/current")
            .set("X-API-TOKEN", "test");

        logger.debug(response.body);
        expect(response.status).toBe(200);
        expect(response.body.data).toBe("OK");

        const user = await UserTest.get();
        expect(user.token).toBeNull();
    });

    it('should reject logout user if token is wrong', async () => {
        const response = await supertest(app)
            .delete("/api/v1/users/current")
            .set("X-API-TOKEN", "salah");

        logger.debug(response.body);
        expect(response.status).toBe(401);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe("Unauthorized");
    });
});
