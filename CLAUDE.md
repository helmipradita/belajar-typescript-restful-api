# CLAUDE.md - AI Assistant Context

This file provides context for AI assistants (Claude Code, GitHub Copilot, etc.) working on this codebase.

## Project Context

**TypeScript RESTful API** - A production-ready Express API with Prisma ORM, featuring user authentication, contact management, and nested address handling.

### Quick Reference

| Aspect | Value |
|--------|-------|
| Entry Point | `src/main.ts` |
| API Base Path | `/api/v1` |
| Auth Header | `X-API-TOKEN` |
| Test Pattern | `**/*.test.ts` |
| Build Output | `dist/` |
| Database | MySQL (via Prisma) |

## Architecture Principles

### Layered Architecture

```
Controller (HTTP) → Service (Business Logic) → Prisma (Database)
                ↓
            Validation (Zod)
                ↓
             Models (DTOs)
```

### File Naming Conventions

- Controllers: `*-controller.ts`
- Services: `*-service.ts`
- Models: `*-model.ts`
- Validation: `*-validation.ts`
- Middleware: `*-middleware.ts`
- Tests: `*.test.ts`

### Code Organization Rules

1. **Controllers**: Handle HTTP only. No business logic.
2. **Services**: All business logic and database operations.
3. **Validation**: Centralized in `validation/` using Zod.
4. **Models**: DTOs for response formatting (not database models).
5. **Middleware**: Reusable request/response processing.

## Working with This Codebase

### Adding a New Feature

1. Create validation schema in `src/validation/`
2. Create model interface in `src/model/`
3. Create service in `src/service/`
4. Create controller in `src/controller/`
5. Add routes in `src/route/api.ts` or `src/route/public-api.ts`

### Adding Tests

Place tests in `test/` mirroring the `src/` structure:

```
test/
├── user.test.ts
├── contact.test.ts
├── address.test.ts
└── auth-middleware.test.ts
```

### Database Changes

1. Modify `prisma/schema.prisma`
2. Run `npm run db:migrate:dev`
3. Run `npm run db:generate`

## Important Patterns

### Error Handling

Use `ErrorResponse` factory methods:

```typescript
// In services
throw ErrorResponse.unauthorized();
throw ErrorResponse.validationFailed([{ field: "email", message: "Invalid" }]);
throw ErrorResponse.notFound("Contact");
```

### Validation

Always validate in services using `Validation.validate()`:

```typescript
const validated = Validation.validate(ContactValidation.CREATE, request);
```

### Database Queries

Use `prismaClient` from `src/application/database.ts`:

```typescript
import { prismaClient } from "./application/database";

const user = await prismaClient.user.findUnique({
  where: { username: "test" }
});
```

### Logging

Use the configured `logger` from `src/application/logging.ts`:

```typescript
import { logger } from "./application/logging";

logger.info({ requestId: req.id, message: "User logged in" });
logger.error({ error: err }, "Database connection failed");
```

## TypeScript Configuration

- **Strict mode**: Enabled
- **Unknown in catch**: `useUnknownInCatchVariables: true`
- **Module**: CommonJS (consider ESM for future)
- **Target**: ES2016 (upgrade to ES2022 recommended)

## Testing Guidelines

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { web } from '../src/application/web';
import { logger } from '../src/application/logging';

describe('Feature Name', () => {
  afterEach(async () => {
    // cleanup
  });

  it('should do something', async () => {
    // test
  });
});
```

### Test Utilities

Located in `test/test-util.ts` - reuse helper functions for:
- Creating test users
- Cleaning up test data
- Authentication helpers

## Known Issues & Gotchas

1. **CORS in Production**: `.env` has `CORS_ORIGIN="*"` - fix this before deploying
2. **Token Expiration**: Custom UUID tokens, not JWT - tokens expire after 7 days
3. **Zod v4**: Update to top-level validators (`z.email()` not `z.string().email()`)
4. **Express 5**: Async errors are automatically caught - no need for try/catch in async handlers

## Dependencies & Versions

As of April 2026:

| Package | Version | Notes |
|---------|---------|-------|
| express | ^5.2.1 | Major v5 - async error handling automatic |
| prisma | ^6.0.0 | Upgrade to v7 available |
| zod | ^4.3.6 | Use top-level validators |
| typescript | ^6.0.2 | Current |
| jest | ^30.3.0 | Current |

## Commands Reference

```bash
# Development
npm run dev              # Start with hot reload
npm run dev:debug        # Start with debug inspector

# Building
npm run build            # Compile to dist/
npx tsc --noEmit        # Type check only

# Testing
npm test                 # Run all tests
npm run test:coverage    # With coverage report
npm run test:watch       # Watch mode

# Database
npm run db:studio        # Open Prisma Studio
npm run db:migrate:dev   # Run migrations
npm run db:generate      # Generate Prisma Client

# Code Quality
npm run lint            # Check code
npm run lint:fix        # Auto-fix issues
npm run format          # Format with Prettier
```

## Environment Variables

Required in `.env`:

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/dbname
CORS_ORIGIN=http://localhost:5173
```

## Security Considerations

1. **Never commit** `.env` file - use `.env.example`
2. **Password hashing** uses bcrypt (default rounds)
3. **Rate limiting** configured per endpoint type
4. **CORS** should be restricted in production
5. **Helmet** headers are enabled

## Documentation Context

When making changes, also update:
- `README.md` for user-facing changes
- `API.md` for endpoint changes
- `CHANGELOG.md` for version history
- This file (`CLAUDE.md`) for architectural changes

## Common Tasks

### Add a new API endpoint

1. Add validation schema in `src/validation/`
2. Add service method in `src/service/`
3. Add controller method in `src/controller/`
4. Add route in `src/route/api.ts` or `src/route/public-api.ts`
5. Add tests in `test/`
6. Update `API.md`

### Debug database issues

```bash
npm run db:studio  # Open Prisma Studio to inspect data
```

### Run specific test

```bash
npm test -- --testNamePattern="should login"
npm test -- test/user.test.ts
```

### Fix type errors

```bash
npx tsc --noEmit  # Show all type errors
```

---

**Last Updated**: 2026-04-07
**For AI Assistants**: This file should be read first when working on this codebase.
