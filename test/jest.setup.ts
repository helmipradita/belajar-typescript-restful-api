import {cleanupTestData} from "./test-util";

// Setup: Clean up database before all tests run
beforeAll(async () => {
    await cleanupTestData();
});

// Teardown: Clean up database after all tests run
afterAll(async () => {
    await cleanupTestData();
});
