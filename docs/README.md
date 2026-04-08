# Documentation - Offline Reference (April 2026)

This folder contains offline documentation for all major packages used in this project. Documentation was fetched using Context7 in April 2026.

## Package Documentation

| Package | Version | Documentation |
|---------|---------|---------------|
| [Express](./express.md) | 4.19.2 | Routing, middleware, error handling |
| [Prisma](./prisma.md) | 5.22.0 | Client API, queries, migrations, error handling |
| [Zod](./zod.md) | 3.24.2 | Validation schemas, error handling |
| [Jest](./jest.md) | 30.3.0 | Testing, mocking, async patterns |
| [Winston](./winston.md) | 3.19.0 | Logging, transports, formats |
| [TypeScript](./typescript.md) | 5.7.2 | Configuration, tsconfig, Node 22 |

## Quick Reference

### Common Patterns

#### Error Handling (Express + Zod)
```typescript
import { ZodError } from "zod";
import { ResponseError } from "../error/response-error";

export const errorMiddleware = async (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message
        }));
        res.status(400).json({ message: "Validation Error", errors });
    } else if (error instanceof ResponseError) {
        res.status(error.status).json({ message: error.message });
    } else {
        res.status(500).json({ message: "Internal Server Error" });
    }
};
```

#### Prisma Error Handling
```typescript
import { Prisma } from "@prisma/client";

try {
    await prisma.user.create({ data: userData });
} catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            // Unique constraint failed
            const field = error.meta?.target;
            console.error(`Unique constraint failed on: ${field}`);
        }
    }
}
```

#### Winston Logging
```typescript
import winston from "winston";

export const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});
```

#### Jest Async Testing
```typescript
import { describe, it, expect } from '@jest/globals';

describe('API', () => {
    it('should return data', async () => {
        const response = await fetchData();
        expect(response).toBe('data');
    });

    it('should handle errors', async () => {
        await expect(fetchBadData()).rejects.toThrow('Error');
    });
});
```

## Node 22.22.2 Compatibility

All packages in this documentation are verified to work with Node 22.22.2.

### TypeScript Configuration for Node 22
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "commonjs",
    "moduleResolution": "Node"
  }
}
```

### Babel Configuration for Node 22
```json
{
  "presets": [
    ["@babel/preset-env", { "targets": { "node": "22.22" } }],
    "@babel/preset-typescript"
  ]
}
```

---

**Generated:** 2026-04-07
**Source:** Context7 (https://context7.com)
