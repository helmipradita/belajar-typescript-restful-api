# Architecture Overview

System architecture and design patterns for the belajar-typescript-restful-api project.

## Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Express.js 5.2.1  │  Winston 3.19.0  │  Zod 4.3.6       │
│  (Web Framework)  │  (Logging)        │  (Validation)    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic                           │
├─────────────────────────────────────────────────────────────┤
│  Controller Layer  →  Service Layer  →  Validation Layer    │
│  (HTTP Handling)  │  (Business Logic) │  (Input Check)     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Access                              │
├─────────────────────────────────────────────────────────────┤
│  Prisma ORM 6.0.0  │  Redis 5.11.0  │  MySQL               │
│  (Database ORM)  │  (Cache)         │  (Database)         │
└─────────────────────────────────────────────────────────────┘
```

## Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Routes                                │
│  (Define endpoints and attach middleware)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Controllers                              │
│  (Handle HTTP request/response, NO business logic)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       Middleware                              │
│  (Auth, Error Handling, Logging, Rate Limiting)            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       Services                                │
│  (All business logic and database operations)               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Prisma ORM                               │
│  (Type-safe database access)                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       MySQL Database                           │
│  (Persistent data storage)                                  │
└─────────────────────────────────────────────────────────────┘
```

## File Organization

```
src/
├── application/          # Application setup
│   ├── database.ts      # Prisma client with logging
│   ├── logging.ts       # Winston logger configuration
│   ├── redis.ts         # Redis client with reconnection
│   └── web.ts           # Express app configuration
├── controller/          # HTTP request handlers
│   ├── user-controller.ts
│   ├── contact-controller.ts
│   └── address-controller.ts
├── middleware/          # Express middleware
│   ├── auth-middleware.ts      # Token authentication
│   ├── error-middleware.ts     # Global error handler
│   ├── rate-limit-middleware.ts # Rate limiting
│   └── logging-middleware.ts    # Request logging
├── model/              # Data Transfer Objects (DTOs)
│   ├── user-model.ts
│   ├── contact-model.ts
│   ├── address-model.ts
│   └── page.ts
├── route/              # API routes
│   ├── api.ts          # Protected routes (require auth)
│   └── public-api.ts   # Public routes (login, register)
├── service/            # Business logic
│   ├── user-service.ts
│   ├── contact-service.ts
│   └── address-service.ts
├── validation/         # Zod validation schemas
│   ├── user-validation.ts
│   ├── contact-validation.ts
│   ├── address-validation.ts
│   └── validation.ts   # Validation utility
├── error/              # Custom error classes
│   └── response-error.ts
├── type/               # TypeScript types
│   └── user-request.ts
└── main.ts             # Application entry point
```

## Design Patterns

### 1. Controller Pattern

Controllers use static methods and follow these rules:
- **NO** business logic in controllers
- **ONLY** HTTP handling (parse request, send response)
- **ALL** logic delegated to services

```typescript
export class UserController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const request: CreateUserRequest = req.body as CreateUserRequest;
      const response = await UserService.register(request);
      res.status(200).json({ data: response });
    } catch (e) {
      next(e);
    }
  }
}
```

### 2. Service Pattern

Services contain:
- **ALL** business logic
- Database operations via Prisma
- Input validation

```typescript
export class UserService {
  static async register(request: CreateUserRequest): Promise<UserResponse> {
    // Validate input
    const registerRequest = Validation.validate(UserValidation.REGISTER, request);

    // Check duplicate
    const totalUserWithSameUsername = await prismaClient.user.count({
      where: { username: registerRequest.username }
    });

    if (totalUserWithSameUsername != 0) {
      throw new ResponseError(400, "Username already exists");
    }

    // Hash password
    registerRequest.password = await bcrypt.hash(registerRequest.password, 10);

    // Save to database
    const user = await prismaClient.user.create({ data: registerRequest });

    return toUserResponse(user);
  }
}
```

### 3. Validation Pattern

Centralized validation using Zod:

```typescript
export class Validation {
  static validate<T>(schema: ZodType, data: T): T {
    return schema.parse(data);
  }
}

// Usage in service
const validated = Validation.validate(UserValidation.REGISTER, request);
```

### 4. Error Handling Pattern

Custom error class with factory methods:

```typescript
export class ResponseError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors: Array<{ field: string; message: string }> = []
  ) {
    super(message);
    this.name = "ResponseError";
  }
}

export class ErrorResponse {
  static unauthorized(message = "Unauthorized") {
    return new ResponseError(401, message);
  }

  static validationFailed(errors: Array<{ field: string; message: string }>) {
    return new ResponseError(400, "Validation Error", errors);
  }

  static notFound(resource: string) {
    return new ResponseError(404, `${resource} not found`);
  }
}
```

### 5. Middleware Pattern

Express middleware for cross-cutting concerns:

```typescript
export const authMiddleware = async (req: UserRequest, res: Response, next: NextFunction) => {
  const token = req.get("X-API-TOKEN");

  if (token) {
    const user = await prismaClient.user.findFirst({ where: { token } });
    if (user) {
      req.user = user;
      next();
      return;
    }
  }

  res.status(401).json({ errors: "Unauthorized" });
};
```

## Database Schema

```
users
├── id (PK)
├── username (unique)
├── password (hashed)
├── name
├── token (nullable)
└── token_expires_at (nullable)

contacts
├── id (PK, auto-generated)
├── first_name
├── last_name (nullable)
├── email (nullable)
├── phone (nullable)
└── username (FK → users)

addresses
├── id (PK, auto-generated)
├── contact_id (FK → contacts)
├── street (nullable)
├── city (nullable)
├── province (nullable)
├── country (nullable)
└── postal_code (nullable, required)
```

## Request Flow

```
1. HTTP Request → Express App
2. Logging Middleware (log request)
3. Rate Limit Middleware (check limits)
4. Route Handler
5. Auth Middleware (if protected route)
6. Controller (parse request)
7. Service (business logic + validation)
8. Prisma (database operation)
9. Controller (format response)
10. Response Sent
```

## Security Considerations

- **Password Hashing**: bcrypt with default rounds
- **Token-Based Auth**: Custom UUID tokens (stored in database)
- **Input Validation**: Zod schemas on all inputs
- **Rate Limiting**: Per-endpoint rate limits
- **CORS**: Configurable origins via .env
- **Security Headers**: Helmet middleware

---

**Last Updated:** 2026-04-10
