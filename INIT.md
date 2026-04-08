# belajar-typescript-restful-api - Project Initialization & Context

## Project Overview

**Name**: belajar-typescript-restful-api
**Version**: 1.0.0
**Description**: Production-ready RESTful API for managing contacts and addresses
**Author**: Eko Kurniawan Khannedy (Forked by Helmipradita)
**License**: ISC
**Node.js**: 20+
**TypeScript**: 6.0.2

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run db:migrate:dev

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
npm start
```

## Architecture Summary

### Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | Node.js | 20+ | JavaScript runtime |
| **Language** | TypeScript | 6.0.2 | Type-safe JavaScript |
| **Framework** | Express | 5.2.1 | Web framework |
| **ORM** | Prisma | 6.0.0 | Database ORM |
| **Validation** | Zod | 4.3.6 | Schema validation |
| **Testing** | Jest | 30.3.0 | Testing framework |
| **Logging** | Winston | 3.19.0 | Structured logging |
| **Security** | Helmet | 8.1.0 | Security headers |
| **Security** | bcrypt | 5.0.6 | Password hashing |
| **Rate Limiting** | express-rate-limit | 8.3.2 | API rate limiting |
| **CORS** | cors | 2.8.6 | Cross-origin resource sharing |
| **Documentation** | swagger-jsdoc | 6.2.8 | API documentation |

### Directory Structure

```
belajar-typescript-restful-api/
├── src/
│   ├── application/          # Application setup
│   │   ├── database.ts      # Prisma client setup
│   │   ├── logging.ts       # Winston logger config
│   │   └── web.ts           # Express app setup
│   ├── config/             # Configuration
│   │   ├── env.ts          # Environment validation (Zod)
│   │   ├── response-messages.ts
│   │   └── swagger.ts      # OpenAPI config
│   ├── controller/          # HTTP Controllers
│   │   ├── address-controller.ts
│   │   ├── contact-controller.ts
│   │   ├── health-controller.ts
│   │   └── user-controller.ts
│   ├── error/              # Error handling
│   │   ├── response-error.ts
│   │   └── error.ts
│   ├── middleware/         # Express middleware
│   │   ├── auth-middleware.ts
│   │   ├── error-middleware.ts
│   │   ├── logging-middleware.ts
│   │   └── rate-limit-middleware.ts
│   ├── model/             # Data models (DTOs)
│   │   ├── address-model.ts
│   │   ├── contact-model.ts
│   │   ├── page.ts
│   │   └── user-model.ts
│   ├── route/             # API routes
│   │   ├── api.ts          # Protected routes (/api/v1)
│   │   └── public-api.ts   # Public routes
│   ├── service/           # Business logic
│   │   ├── address-service.ts
│   │   ├── contact-service.ts
│   │   ├── health-service.ts
│   │   └── user-service.ts
│   ├── type/              # TypeScript types
│   │   └── error.ts
│   ├── util/              # Utilities
│   │   └── user-request.ts
│   ├── validation/         # Zod schemas
│   │   ├── address-validation.ts
│   │   ├── contact-validation.ts
│   │   ├── user-validation.ts
│   │   └── validation.ts
│   └── main.ts            # Entry point
├── prisma/
│   └── schema.prisma      # Database schema
├── test/                 # Test files
├── dist/                 # Compiled output
└── coverage/             # Test coverage
```

## Coding Patterns & Conventions

### 1. Controller Pattern

Controllers use static methods and follow this pattern:

```typescript
export class UserController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const request: CreateUserRequest = req.body as CreateUserRequest;
      const response = await UserService.register(request);
      res.status(200).json({
        message: ResponseMessage.USER_REGISTERED,
        data: response,
      });
    } catch (error) {
      next(normalizeError(error));
    }
  }
}
```

### 2. Service Pattern

Services contain business logic and use Prisma for database operations:

```typescript
export class UserService {
  static async register(request: CreateUserRequest): Promise<UserResponse> {
    const registerRequest = Validation.validate(UserValidation.REGISTER, request);
    // ... business logic
    return userResponse;
  }
}
```

### 3. Validation Pattern

Zod schemas are defined in validation classes:

```typescript
export class UserValidation {
  static readonly REGISTER: ZodType = z.object({
    username: z.string().min(1).max(100),
    password: passwordSchema,
    name: z.string().min(1).max(100),
  });
}
```

**Note for Zod v4**: Update to top-level validators:
- `z.string().email()` → `z.email()`
- `z.string().uuid()` → `z.uuid()`
- `z.string().url()` → `z.url()`

### 4. Error Handling Pattern

Custom error class with factory methods:

```typescript
export class ResponseError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors: Array<{ field: string; message: string; value?: unknown }> = []
  ) {
    super(message);
    this.name = "ResponseError";
  }
}

export class ErrorResponse {
  static unauthorized(message = ResponseMessage.UNAUTHORIZED) {
    return new ResponseError(401, message);
  }
  // ... other factory methods
}
```

### 5. Middleware Pattern

```typescript
export const loggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.id = crypto.randomUUID();
  const startTime = Date.now();
  logger.info({ requestId: req.id, method: req.method, path: req.originalUrl });
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.info({ requestId: req.id, status: res.statusCode, duration: `${duration}ms` });
  });
  next();
};
```

### 6. Authentication Pattern

Custom token-based auth (not JWT):

```typescript
export const authMiddleware = async (req: UserRequest, res: Response, next: NextFunction) => {
  const token = req.get("X-API-TOKEN");
  if (token) {
    const user = await prismaClient.user.findFirst({
      where: { token: token }
    });
    if (user && user.token_expires_at && user.token_expires_at < new Date()) {
      return res.status(401).json({ message: "Token expired" });
    }
    req.user = user;
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
```

## API Endpoints

### Public Routes
- `POST /api/v1/users` - Register user
- `POST /api/v1/users/login` - Login
- `GET /health` - Health check

### Protected Routes (require X-API-TOKEN header)
- `GET /api/v1/users/current` - Get current user
- `PATCH /api/v1/users/current` - Update user
- `DELETE /api/v1/users/logout` - Logout
- `POST /api/v1/contacts` - Create contact
- `GET /api/v1/contacts` - Search contacts
- `GET /api/v1/contacts/:id` - Get contact
- `PUT /api/v1/contacts/:id` - Update contact
- `DELETE /api/v1/contacts/:id` - Delete contact
- `POST /api/v1/contacts/:contactId/addresses` - Create address
- `GET /api/v1/contacts/:contactId/addresses` - List addresses
- `GET /api/v1/contacts/:contactId/addresses/:addressId` - Get address
- `PUT /api/v1/contacts/:contactId/addresses/:addressId` - Update address
- `DELETE /api/v1/contacts/:contactId/addresses/:addressId` - Delete address

## Configuration Files

### tsconfig.json

Current configuration uses:
- Target: ES2016 (consider upgrading to ES2022)
- Module: CommonJS (consider ES modules for modern Node.js)
- Strict mode: Enabled
- Root: `./src`
- Output: `./dist`

### jest.config.ts

- Test environment: Node
- Transform: babel-jest
- Coverage threshold: 70%
- Test pattern: `**/*.test.ts`

### .env Variables

Required environment variables:
- `NODE_ENV` - development|production|test
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - MySQL connection string
- `CORS_ORIGIN` - Allowed CORS origins

**Security Note**: Currently uses `CORS_ORIGIN="*"` which is not secure for production.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run Jest tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run build` | Compile TypeScript |
| `npm run dev` | Start development server |
| `npm start` | Start production server |
| `npm run format` | Format with Prettier |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:migrate:dev` | Run migrations |
| `npm run db:generate` | Generate Prisma Client |

## Database Schema

### User
- `username` (PK) - String(100)
- `password` - String(100), bcrypt hashed
- `name` - String(100)
- `token` - String(100), nullable
- `token_expires_at` - DateTime, nullable

### Contact
- `id` (PK) - String(100), auto-generated
- `first_name` - String(100)
- `last_name` - String(100), nullable
- `email` - String(200), nullable
- `phone` - String(20), nullable
- `username` (FK) - Owner reference

### Address
- `id` (PK) - String(100), auto-generated
- `contact_id` (FK) - Parent contact
- `street` - String(200), nullable
- `city` - String(100), nullable
- `province` - String(100), nullable
- `country` - String(100), nullable
- `postal_code` - String(10), nullable

## Testing Patterns

### Current Test Setup

Uses Jest with babel-jest transformer. Test files are in `test/` directory.

### Writing Tests

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { web } from '../src/application/web';

describe('User API', () => {
  it('should register a new user', async () => {
    const response = await request(web)
      .post('/api/v1/users')
      .send({ username: 'test', password: 'Test1234', name: 'Test User' })
      .expect(201);

    expect(response.body.data.username).toBe('test');
  });
});
```

## Known Issues & Improvement Areas

1. **CORS Configuration**: Uses wildcard in production
2. **Test Coverage**: Limited test coverage despite Jest setup
3. **Module System**: CommonJS vs ES modules decision needed
4. **TypeScript Target**: ES2016 is outdated
5. **Authentication**: Custom UUID tokens vs JWT
6. **Zod v4 Migration**: Some patterns may need updating

## Documentation Links

- [API Documentation](./API.md) - Complete API specification
- [Architecture](./ARCHITECTURE.md) - System design and patterns
- [Development Guide](./DEVELOPMENT.md) - Development workflows
- [Standards](./STANDARDS.md) - Coding conventions
- [Examples](./EXAMPLES.md) - Usage examples

## Package Documentation (April 2026)

### Latest Package Docs via Context7

- **Express**: `/expressjs/express` - Async error handling in v5
- **Prisma**: `/prisma/prisma` - v7 has new config API
- **Zod**: `/websites/zod_dev_v4` - Top-level validators
- **Jest**: `/jestjs/jest` - v30 CLI changes
- **Winston**: `/winstonjs/winston` - Transport patterns
- **CORS**: `/expressjs/cors` - Dynamic origin validation
- **Helmet**: `/helmetjs/helmet` - Security headers
- **Supertest**: `/forwardemail/supertest` - Async testing

## Upgrade Notes

See the upgrade plan for detailed steps on:
- Upgrading dependencies
- Migrating to Zod v4 patterns
- Updating Prisma error handling
- Fixing CORS security issues
- Improving test coverage

---

*Generated: 2026-04-07*
*Maintainer: Helmipradita*
