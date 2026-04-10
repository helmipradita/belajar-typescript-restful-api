import {cleanupTestData} from "./test-util";
import {disconnectRedis} from "../src/application/redis";
import {prismaClient} from "../src/application/database";

// Setup: Clean up database before all tests run
beforeAll(async () => {
    await cleanupTestData();
});

// Teardown: Clean up database, disconnect Redis, and disconnect Prisma after all tests run
afterAll(async () => {
    await cleanupTestData();
    await disconnectRedis();
    await prismaClient.$disconnect();
});
