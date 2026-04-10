# Testing Guide

Complete guide for testing the belajar-typescript-restful-api project.

## Test Framework

- **Jest** 30.3.0 - Testing framework
- **Supertest** 7.2.2 - HTTP assertion library

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Run specific test file
npm test -- test/user.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should login"
```

## Test Structure

```
test/
├── user.test.ts           # User API tests
├── contact.test.ts        # Contact API tests
├── address.test.ts        # Address API tests
├── redis.test.ts          # Redis integration tests
├── error-middleware.test.ts # Error handling tests
├── test-util.ts           # Test utilities
└── jest.setup.ts          # Test setup
```

## Test Utilities

Located in `test/test-util.ts`:

```typescript
// Create test user
await UserTest.create()

// Create test user with token
await UserTest.createWithToken()

// Get test user
const user = await UserTest.get()

// Delete test data
await UserTest.delete()
```

## Writing Tests

### Basic Test Pattern

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { web } from '../src/application/web';

describe('Feature Name', () => {
  beforeEach(async () => {
    // Setup before each test
    await UserTest.create();
  });

  afterEach(async () => {
    // Cleanup after each test
    await UserTest.delete();
  });

  it('should do something', async () => {
    const response = await supertest(web)
      .post('/api/endpoint')
      .send({ data: 'value' });

    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
  });
});
```

### API Testing Pattern

```typescript
// POST request
await supertest(web)
  .post('/api/users')
  .send({ username: 'test', password: 'Test1234', name: 'Test' })
  .expect(200);

// GET request with header
await supertest(web)
  .get('/api/users/current')
  .set('X-API-TOKEN', 'test-token')
  .expect(200);

// PUT request
await supertest(web)
  .put('/api/contacts/123')
  .set('X-API-TOKEN', 'test-token')
  .send({ first_name: 'Updated' })
  .expect(200);

// DELETE request
await supertest(web)
  .delete('/api/contacts/123')
  .set('X-API-TOKEN', 'test-token')
  .expect(200);
```

## Test Coverage

Current coverage: **87.79%**

View detailed coverage:

```bash
npm run test:coverage
```

Coverage report is generated in `coverage/` directory.

## Test Database

Tests use the same database as development. All tests cleanup after themselves:

- `beforeEach` - Create test data
- `afterEach` - Delete test data
- `jest.setup.ts` - Global cleanup before all tests

## Redis Testing

Redis tests require Redis to be running:

```bash
# Start Redis
docker-compose up -d redis

# Run Redis tests
npm test -- test/redis.test.ts
```

## Best Practices

1. **Cleanup after each test** - Use `afterEach` to delete created data
2. **Use test utilities** - Reuse `UserTest`, `ContactTest` helpers
3. **Test error cases** - Test both success and failure scenarios
4. **Use descriptive test names** - "should do X when Y"
5. **Arrange-Act-Assert** - Structure tests clearly

## Debugging Tests

```bash
# Run with verbose output
npm test -- --verbose

# Run with debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```
