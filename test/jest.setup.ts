import {cleanupTestData} from "./test-util";
import {disconnectRedis} from "../src/application/redis";

// Setup: Clean up database before all tests run
beforeAll(async () => {
    await cleanupTestData();
});

// Teardown: Clean up database and disconnect Redis after all tests run
afterAll(async () => {
    await cleanupTestData();
    await disconnectRedis();
});
