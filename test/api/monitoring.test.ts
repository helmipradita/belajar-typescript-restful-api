import supertest from "supertest";
import {app} from "../../src/app/app";

describe("Monitoring API", () => {
    it("should return liveness status", async () => {
        const response = await supertest(app).get("/api/v1/healthz");

        expect(response.status).toBe(200);
        expect(response.text).toBe("OK");
    });

    it("should return health status with DB", async () => {
        const response = await supertest(app).get("/api/v1/health");

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("healthy");
    });

    it("should expose prometheus metrics", async () => {
        await supertest(app).get("/api/v1/healthz");

        const response = await supertest(app).get("/api/v1/metrics");

        expect(response.status).toBe(200);
        expect(response.text).toContain("http_requests_total");
        expect(response.text).toContain("http_request_duration_seconds");
        expect(response.text).toContain('/api/v1/healthz"');
    });
});
