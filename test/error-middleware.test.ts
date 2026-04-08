import supertest from "supertest";
import express from "express";
import {errorMiddleware} from "../src/middleware/error-middleware";

describe('Error Middleware', () => {
    it('should handle generic errors (500)', async () => {
        // Create a test app with a route that throws generic Error
        const testApp = express();
        testApp.use(express.json());

        // Add a test route that throws a generic Error
        testApp.get('/test/error', (req, res, next) => {
            throw new Error("Something went wrong");
        });

        // Add error middleware
        testApp.use(errorMiddleware);

        const response = await supertest(testApp)
            .get('/test/error');

        expect(response.status).toBe(500);
        expect(response.body.errors).toBe("Something went wrong");
    });
});
