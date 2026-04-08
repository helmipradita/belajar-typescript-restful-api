# Upgrade Plan: Node 22.22.2 Compatibility & Package Updates (April 2026)

## Context

Project **terakhir update: Februari 2024** (2 tahun lalu). Perlu upgrade besar-besaran untuk kompatibel dengan Node 22.22.2 dan memperbaiki package yang outdated.

**Target:**
- ✅ Node 22.22.2 compatible
- ✅ Stable versions (no beta/alpha)
- ✅ No known vulnerabilities
- ✅ Tetap CommonJS (stabilitas)
- ✅ TypeScript target: ES2022

---

## Package Version Research (April 2026)

| Package | Current | Latest Stable | Node 22 Compatible | Breaking Changes | Priority |
|---------|---------|---------------|-------------------|-----------------|----------|
| **express** | 4.18.2 | 4.19.2 | ✅ | Minor | High |
| **@prisma/client** | 5.10.2 | 5.22.0 | ✅ (≥22.12) | None | High |
| **prisma** | 5.10.2 | 5.22.0 | ✅ (≥22.12) | None | High |
| **zod** | 3.22.4 | 3.24.2 | ✅ | Minor | High |
| **jest** | 29.7.0 | 30.3.0 | ✅ | Minor (CLI flag changes) | Medium |
| **@jest/globals** | 29.7.0 | 30.3.0 | ✅ | Minor | Medium |
| **babel-jest** | 29.7.0 | 30.3.0 | ✅ | Minor | Medium |
| **@babel/preset-env** | 7.23.9 | 7.26.0 | ✅ | None | Medium |
| **@babel/preset-typescript** | 7.23.3 | 7.26.0 | ✅ | None | Medium |
| **winston** | 3.11.0 | 3.19.0 | ✅ | Minor | Low |
| **bcrypt** | 5.1.1 | 5.1.1 | ✅ | None (v6 has breaking changes) | Low |
| **uuid** | 9.0.1 | 9.0.1 | ✅ | v13 is ESM-only | Low |
| **supertest** | 6.3.4 | 7.2.2 | ✅ | Minor | Low |
| **typescript** | 5.3.3 | 5.7.2 | ✅ | Minor | Medium |
| **@types/express** | 4.17.21 | 4.19.0 | ✅ | Minor | Medium |
| **@types/jest** | 29.5.12 | 30.0.0 | ✅ | Minor | Medium |
| **@types/bcrypt** | 5.0.2 | 5.0.2 | ✅ | None | Low |
| **@types/uuid** | 9.0.8 | 9.0.8 | ✅ | None | Low |
| **@types/supertest** | 6.0.2 | 6.0.3 | ✅ | Minor | Low |

**Key Decisions:**
- **Express**: Stay on 4.x (5.x masih beta/unstable)
- **bcrypt**: Stay on 5.x (6.x punya breaking changes)
- **uuid**: Stay on 9.x (13.x ESM-only, butuh perubahan kode)
- **Prisma**: 5.10.2 → 5.22.0 (latest 5.x stable)
- **Zod**: 3.22.4 → 3.24.2 (latest 3.x, v4 breaking changes)

---

## Phase 1: Configuration Updates

### 1.1 tsconfig.json

**Before:**
```json
{
  "include": ["src/**/*"],
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "moduleResolution": "Node",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

**After:**
```json
{
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"],
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "commonjs",
    "moduleResolution": "Node",
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    "useUnknownInCatchVariables": true
  }
}
```

**Changes:**
- `target`: ES2016 → ES2022 (Node 22 features)
- `lib`: ES2022 (modern JavaScript APIs)
- Tambah strict mode options untuk better type safety

### 1.2 babel.config.json

**Before:**
```json
{
  "presets": [
    "@babel/preset-env",
    "@babel/preset-typescript"
  ]
}
```

**After:**
```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "node": "22.22"
        },
        "modules": "commonjs",
        "bugfixes": true
      }
    ],
    "@babel/preset-typescript"
  ]
}
```

### 1.3 Jest Configuration (package.json)

**Before:**
```json
"jest": {
  "transform": {
    "^.+\\.[t|j]sx?$": "babel-jest"
  }
}
```

**After:**
```json
"jest": {
  "testEnvironment": "node",
  "testMatch": ["**/*.test.ts"],
  "transform": {
    "^.+\\.(ts|tsx)$": "babel-jest"
  },
  "moduleFileExtensions": ["ts", "tsx", "js", "json"],
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.d.ts"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  }
}
```

**Note:** Jest 30 mengubah `--testPathPattern` → `--testPathPatterns`

---

## Phase 2: package.json Updates

### 2.1 Complete package.json

```json
{
  "name": "belajar-typescript-restful-api",
  "version": "1.0.0",
  "description": "RESTful API for Contact Management",
  "main": "dist/main.js",
  "scripts": {
    "test": "jest --runInBand",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "build": "tsc",
    "start": "node dist/main.js",
    "dev": "nodemon src/main.ts",
    "lint": "echo 'Linting not configured yet'",
    "db:generate": "prisma generate",
    "db:migrate:dev": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "jest": {
    "testEnvironment": "node",
    "testMatch": ["**/*.test.ts"],
    "transform": {
      "^.+\\.(ts|tsx)$": "babel-jest"
    },
    "moduleFileExtensions": ["ts", "tsx", "js", "json"],
    "collectCoverageFrom": [
      "src/**/*.ts",
      "!src/**/*.d.ts"
    ]
  },
  "author": "Eko Kurniawan Khannedy",
  "license": "ISC",
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "bcrypt": "^5.1.1",
    "express": "^4.19.2",
    "uuid": "^9.0.1",
    "winston": "^3.19.0",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@babel/preset-env": "^7.26.0",
    "@babel/preset-typescript": "^7.26.0",
    "@jest/globals": "^30.3.0",
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^4.19.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^22.0.0",
    "@types/supertest": "^6.0.3",
    "@types/uuid": "^9.0.8",
    "babel-jest": "^30.3.0",
    "jest": "^30.3.0",
    "nodemon": "^3.1.0",
    "prisma": "^5.22.0",
    "supertest": "^7.2.2",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.2"
  }
}
```

### 2.2 Added Dependencies
- `@types/node`: ^22.0.0 (baru - untuk Node 22 types)
- `nodemon`: ^3.1.0 (baru - untuk development)
- `ts-node`: ^10.9.2 (baru - untuk TypeScript execution)

---

## Phase 3: Code Pattern Updates

### 3.1 Files That Need Changes

Based on codebase analysis:

| File | Reason | Changes |
|------|--------|---------|
| `src/validation/*.ts` | Zod 3.24 update | New error handling patterns |
| `src/middleware/error-middleware.ts` | Better error types | Enhanced ZodError handling |
| `src/controller/*.ts` | Express 4.19 updates | Type updates |
| `src/service/*.ts` | Prisma 5.22 updates | Query patterns |

### 3.2 Zod Validation Updates (3.22.4 → 3.24.2)

**File:** `src/validation/user-validation.ts`

**Before:**
```typescript
static readonly REGISTER: ZodType = z.object({
    username: z.string().min(1).max(100),
    password: z.string().min(1).max(100),
    name: z.string().min(1).max(100)
});
```

**After (with better error messages):**
```typescript
static readonly REGISTER: ZodType = z.object({
    username: z.string().min(1, "Username required").max(100, "Username too long"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(1, "Name required").max(100, "Name too long")
});
```

### 3.3 Error Middleware Enhancement

**File:** `src/middleware/error-middleware.ts`

```typescript
import { ZodError } from "zod";
import { ResponseError } from "../error/response-error";
import { Request, Response, NextFunction } from "express";

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
        res.status(400).json({
            message: "Validation Error",
            errors
        });
    } else if (error instanceof ResponseError) {
        res.status(error.status).json({
            message: error.message,
            errors: error.errors || []
        });
    } else {
        console.error("Unexpected error:", error);
        res.status(500).json({
            message: "Internal Server Error",
            errors: [process.env.NODE_ENV === "development" ? error.message : "An error occurred"]
        });
    }
};
```

---

## Phase 4: Testing Updates

### 4.1 Test File Updates for Jest 30

**Jest 30 Breaking Change:** CLI flag `--testPathPattern` → `--testPathPatterns`

**Before (Jest 29):**
```bash
jest --testPathPattern="unit/.*"
```

**After (Jest 30):**
```bash
jest --testPathPatterns="unit/.*"
# Multiple patterns:
jest --testPathPatterns="unit/.*" "integration/.*"
```

### 4.2 Test Pattern Improvements

```typescript
// test/user.test.ts - Updated for Jest 30
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { web } from '../src/application/web';

describe('User API', () => {
    afterEach(async () => {
        // Cleanup
    });

    it('should register a new user', async () => {
        const response = await request(web)
            .post('/api/v1/users')
            .send({
                username: 'test',
                password: 'Test1234',
                name: 'Test User'
            });

        expect(response.status).toBe(200);
        expect(response.body.data.username).toBe('test');
    });
});
```

---

## Phase 5: Migration Steps

### Step 1: Backup & Clean
```bash
# Backup current state
git add -A
git commit -m "backup: before upgrade"

# Clean install
rm -rf node_modules package-lock.json
```

### Step 2: Update package.json
```bash
# Update dependencies
npm install

# Generate Prisma client
npm run db:generate
```

### Step 3: Update Configuration Files
```bash
# Update tsconfig.json
# Update babel.config.json
# Update jest config in package.json
```

### Step 4: Type Check
```bash
npx tsc --noEmit
# Fix any type errors
```

### Step 5: Build
```bash
npm run build
# Verify dist/ output
```

### Step 6: Test
```bash
npm test
# Fix any test failures
```

### Step 7: Verify Runtime
```bash
npm run dev
# Test all API endpoints
```

---

## Phase 6: Verification Checklist

- [ ] `npm install` successful
- [ ] `npx tsc --noEmit` no errors
- [ ] `npm run build` successful
- [ ] `npm test` all tests pass
- [ ] `npm run dev` server starts
- [ ] All API endpoints functional
- [ ] No console errors or warnings
- [ ] Database operations working
- [ ] Authentication working

---

## Critical Files Reference

| File | Purpose | Changes |
|------|---------|---------|
| `package.json` | Dependencies | Update all versions |
| `tsconfig.json` | TypeScript config | Update target/lib |
| `babel.config.json` | Babel config | Add Node 22 target |
| `src/validation/*.ts` | Zod schemas | Enhance error messages |
| `src/middleware/error-middleware.ts` | Error handler | Better ZodError handling |
| `test/*.test.ts` | Test files | Update for Jest 30 |

---

## Rollback Plan

Jika ada masalah:
```bash
git reset --hard HEAD
git checkout <backup-commit>
npm install
```

---

## Post-Upgrade Improvements (Future)

1. **Add ESLint & Prettier** for code quality
2. **Add comprehensive test coverage**
3. **Add rate limiting middleware**
4. **Add input sanitization**
5. **Consider JWT for authentication**
6. **Add Docker configuration updates**

---

**Generated:** 2026-04-07
**Target Node:** v22.22.2
**Status:** Ready for implementation
