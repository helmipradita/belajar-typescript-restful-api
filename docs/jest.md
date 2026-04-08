# Jest 30.3 - Documentation (April 2026)

Version: **30.3.0** | Node 22 Compatible: ✅

## Overview

Jest is a delightful JavaScript Testing Framework with focus on simplicity.

## Breaking Changes from Jest 29

### CLI Flag Changes

```bash
# Jest 29 (old)
jest --testPathPattern="unit/.*"

# Jest 30 (new)
jest --testPathPatterns="unit/.*"

# Multiple patterns (new)
jest --testPathPatterns="unit/.*" "integration/.*"
```

### Type Improvements

Jest 30 has better type inference for CalledWith matchers:

```typescript
// Function with typed parameters
const myFunction = (value: number): void => {
    // implementation
};

// Jest 30 - TypeScript compile error for wrong type
const mockFn = jest.fn(myFunction);
expect(mockFn).toHaveBeenCalledWith("string"); // ❌ TS Error!

// Fixed - Correct type
expect(mockFn).toHaveBeenCalledWith(42); // ✅
```

## Basic Tests

### Test Structure

```typescript
import { describe, it, expect } from '@jest/globals';

describe('Math operations', () => {
    it('should add two numbers', () => {
        expect(1 + 1).toBe(2);
    });

    it('should multiply two numbers', () => {
        expect(2 * 3).toBe(6);
    });
});
```

### Matchers

```typescript
// Equality
expect(value).toBe(4);
expect(value).toEqual({ a: 1, b: 2 });

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeGreaterThanOrEqual(3);
expect(value).toBeLessThan(5);
expect(value).toBeLessThanOrEqual(5);
expect(value).toBeCloseTo(0.3, 2);

// Strings
expect(value).toMatch(/text/);
expect(value).toContain('substring');

// Arrays
expect(array).toContain('item');
expect(array).toHaveLength(3);

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ a: 1 });
```

## Async Testing

### Promise-based

```typescript
// Return the promise
test('promise resolves', () => {
    return fetchData().then(data => {
        expect(data).toBe('data');
    });
});

// Use resolves matcher
test('resolves to correct value', async () => {
    await expect(Promise.resolve('value')).resolves.toBe('value');
});

// Use rejects matcher
test('rejects with error', async () => {
    await expect(Promise.reject(new Error('fail'))).rejects.toThrow('fail');
});
```

### Async/Await

```typescript
test('async function returns data', async () => {
    const data = await fetchData();
    expect(data).toBe('data');
});

test('async function throws', async () => {
    await expect(asyncFunction()).rejects.toThrow('Error');
});
```

### Callbacks

```typescript
test('callback is called', (done) => {
    fetchDataCallback((data) => {
        try {
            expect(data).toBe('data');
            done();
        } catch (error) {
            done(error);
        }
    });
});
```

### Assertion Count

```typescript
test('all assertions run', async () => {
    expect.assertions(2);

    const data = await fetchData();
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
});

test('at least one assertion runs', () => {
    expect.hasAssertions();

    return fetchData().then(data => {
        expect(data).toBeDefined();
    });
});
```

## Mocking

### Function Mocks

```typescript
// Simple mock
const mockFn = jest.fn();
mockFn('arg1', 'arg2');
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenCalledTimes(1);

// Mock return value
const mockFn = jest.fn(() => 42);
expect(mockFn()).toBe(42);

// Mock implementation
const mockFn = jest.fn((a, b) => a + b);
expect(mockFn(1, 2)).toBe(3);

// Mock with different return values
const mockFn = jest.fn()
    .mockReturnValueOnce('first')
    .mockReturnValueOnce('second')
    .mockReturnValue('default');

expect(mockFn()).toBe('first');
expect(mockFn()).toBe('second');
expect(mockFn()).toBe('default');
expect(mockFn()).toBe('default');
```

### Async Mocks

```typescript
// Resolved value
const asyncMock = jest.fn().mockResolvedValue(43);
await asyncMock(); // 43

// Rejected value
const asyncMock = jest.fn().mockRejectedValue(new Error('Error'));
await asyncMock(); // throws Error

// Multiple resolved values
const asyncMock = jest.fn()
    .mockResolvedValueOnce('first call')
    .mockResolvedValueOnce('second call')
    .mockResolvedValue('default');

await asyncMock(); // 'first call'
await asyncMock(); // 'second call'
await asyncMock(); // 'default'
```

### Module Mocks

```typescript
// Mock entire module
jest.mock('../myModule');

import { myFunction } from '../myModule';

myFunction.mockReturnValue('mocked value');

expect(myFunction()).toBe('mocked value');

// Partial mock
jest.mock('../myModule', () => ({
    ...jest.requireActual('../myModule'),
    myFunction: jest.fn(() => 'mocked')
}));
```

### Spying on Functions

```typescript
const spy = jest.spyOn(myModule, 'myFunction');
spy.mockReturnValue('mocked');

// Test
expect(myModule.myFunction()).toBe('mocked');
expect(spy).toHaveBeenCalled();

// Restore original
spy.mockRestore();
```

## Setup & Teardown

```typescript
describe('Database tests', () => {
    beforeAll(async () => {
        // Runs once before all tests
        await initializeDatabase();
    });

    afterAll(async () => {
        // Runs once after all tests
        await closeDatabase();
    });

    beforeEach(() => {
        // Runs before each test
        clearTestData();
    });

    afterEach(() => {
        // Runs after each test
        cleanup();
    });

    it('test 1', () => {
        // Test code
    });
});
```

## HTTP Testing with Supertest

```typescript
import request from 'supertest';
import { app } from '../app';

describe('User API', () => {
    it('should create a user', async () => {
        const response = await request(app)
            .post('/api/users')
            .send({
                username: 'test',
                password: 'Test1234',
                name: 'Test User'
            })
            .expect(201)
            .expect('Content-Type', /json/);

        expect(response.body.username).toBe('test');
        expect(response.body).toHaveProperty('id');
    });

    it('should return 400 for invalid data', async () => {
        const response = await request(app)
            .post('/api/users')
            .send({ username: 'test' }) // Missing password
            .expect(400);

        expect(response.body.message).toContain('required');
    });
});
```

## Test Configuration

### jest.config.js

```javascript
module.exports = {
    // Test environment
    testEnvironment: 'node',

    // Test files
    testMatch: ['**/*.test.ts'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],

    // Transform
    transform: {
        '^.+\\.(ts|tsx)$': 'babel-jest'
    },

    // Module paths
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },

    // Coverage
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/main.ts'
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

    // Clear mocks between tests
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};
```

### Test Setup File

```typescript
// test/setup.ts
import { jest } from '@jest/globals';

// Global test timeout
jest.setTimeout(10000);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'test-db-url';

// Setup global mocks before all tests
beforeAll(async () => {
    // Initialize test database
});

// Cleanup after all tests
afterAll(async () => {
    // Close connections
});
```

## Common Patterns

### Test Factory

```typescript
// test/factories/user.factory.ts
export class UserFactory {
    static async create(overrides = {}) {
        const defaultData = {
            username: 'test_user',
            name: 'Test User',
            password: 'hashed_password',
            ...overrides
        };

        return prisma.user.create({ data: defaultData });
    }

    static withToken(overrides = {}) {
        return this.create({
            ...overrides,
            token: 'test_token',
            tokenExpiresAt: new Date(Date.now() + 3600000)
        });
    }
}

// Usage in test
const user = await UserFactory.create({ username: 'custom' });
```

### Test Utilities

```typescript
// test/util/auth.ts
export function createAuthHeader(token: string) {
    return { 'X-API-TOKEN': token };
}

export async function authenticateUser(user: any) {
    const token = generateToken(user.id);
    await prisma.user.update({
        where: { id: user.id },
        data: { token }
    });
    return token;
}

// test/util/cleanup.ts
export async function cleanupDatabase() {
    await prisma.user.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.address.deleteMany();
}
```

---

**Source:** Context7 - /jestjs/jest
**Last Updated:** 2026-04-07
