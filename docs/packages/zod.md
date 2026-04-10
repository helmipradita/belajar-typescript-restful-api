# Zod 4.3 - Documentation (April 2026)

Version: **4.3.6** | Node 22 Compatible: ✅

## Overview

Zod is a TypeScript-first schema validation library with static type inference.

## What's New in Zod 4

### Top-Level String Format Validators

Zod 4 promotes string format validators to top-level functions:

```typescript
// Zod 4 (Recommended)
z.email();           // ✅ Email validation
z.uuid();            // ✅ RFC 9562/4122 compliant UUID
z.url();             // ✅ URL validation
z.emoji();           // ✅ Single emoji character
z.base64();          // ✅ Base64 encoding
z.ipv4();            // ✅ IPv4 address
z.ipv6();            // ✅ IPv6 address
z.iso.date();        // ✅ ISO 8601 date
z.iso.time();        // ✅ ISO 8601 time
z.iso.datetime();    // ✅ ISO 8601 datetime

// Zod 3 (Deprecated)
z.string().email();      // ❌ Deprecated
z.string().uuid();       // ❌ Deprecated
z.string().url();        // ❌ Deprecated
```

### Unified Error Customization

Zod 4 unifies error customization under a single `error` parameter:

```typescript
// Zod 4 (Recommended)
z.string().min(5, { error: "Too short." });
z.string({
  error: (issue) => issue.code === 'too_small'
    ? "Must be at least 5 characters"
    : "Invalid input"
});

// Zod 3 (Deprecated)
z.string().min(5, { message: "Too short." });
z.string({
  invalid_type_error: "Not a string",
  required_error: "This field is required"
});
```

## Basic Schemas

### Primitive Types

```typescript
import { z } from 'zod';

// String
const nameSchema = z.string();
nameSchema.parse('John'); // ✅
nameSchema.parse(123);    // ❌ throws ZodError

// Number
const ageSchema = z.number().positive().int();
ageSchema.parse(25);  // ✅
ageSchema.parse(-5);  // ❌

// Boolean
const boolSchema = z.boolean();

// Date
const dateSchema = z.date();

// Literal (exact value)
const statusSchema = z.literal('ACTIVE');
```

### String Validations

```typescript
// Basic string validation
const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number');

// Top-level format validators
const emailSchema = z.email('Invalid email');
const urlSchema = z.url('Invalid URL');
const uuidSchema = z.uuid('Invalid UUID');
const ipv4Schema = z.ipv4('Invalid IPv4');
```

### Object Schema

```typescript
const userSchema = z.object({
    username: z.string().min(1).max(100),
    password: z.string().min(8),
    name: z.string().min(1).max(100),
    age: z.number().optional(),
    email: z.email().optional()
});

// Type inference
type User = z.infer<typeof userSchema>;
// { username: string; password: string; name: string; age?: number; email?: string }
```

### Arrays

```typescript
const arraySchema = z.array(z.string());
const nonEmptyArray = z.array(z.string()).min(1);
const fixedLengthArray = z.array(z.number()).length(5);

// Example: tags
const postSchema = z.object({
    title: z.string(),
    tags: z.array(z.string()).min(1).max(5)
});
```

### Enums

```typescript
const statusEnum = z.enum(['PENDING', 'ACTIVE', 'INACTIVE']);

// Type: 'PENDING' | 'ACTIVE' | 'INACTIVE'
type Status = z.infer<typeof statusEnum>;
```

### Optional & Nullable

```typescript
const schema = z.object({
    // Optional (undefined is allowed)
    nickname: z.string().optional(),

    // Nullable (null is allowed)
    bio: z.string().nullable(),

    // Optional + Nullable (both undefined and null)
    middleName: z.string().optional().nullable(),

    // Default value
    role: z.string().default('USER'),

    // Transform
    email: z.string().transform(val => val.toLowerCase())
});
```

## Validation

### Parse vs SafeParse

```typescript
// Parse - throws on error
try {
    const result = userSchema.parse({
        username: 'john',
        password: 'password123',
        name: 'John Doe'
    });
    console.log(result); // Validated data
} catch (error) {
    if (error instanceof z.ZodError) {
        console.error(error.errors);
    }
}

// SafeParse - returns { success, data, error }
const result = userSchema.safeParse(input);

if (result.success) {
    console.log(result.data); // Validated data
} else {
    console.error(result.error.errors); // Array of validation issues
}
```

### Custom Refinements

```typescript
const passwordSchema = z.string()
    .min(8)
    .refine(
        (val) => /[A-Z]/.test(val),
        { message: 'Must contain uppercase letter' }
    )
    .refine(
        (val) => /[a-z]/.test(val),
        { message: 'Must contain lowercase letter' }
    )
    .refine(
        (val) => /[0-9]/.test(val),
        { message: 'Must contain number' }
    );
```

## Error Handling

### ZodError Structure

```typescript
try {
    schema.parse(data);
} catch (error) {
    if (error instanceof z.ZodError) {
        error.errors.forEach((issue) => {
            console.log({
                field: issue.path.join('.'),
                message: issue.message,
                code: issue.code
            });
        });
    }
}
```

### Unified Error Customization

```typescript
// Single error parameter
const schema = z.object({
    username: z.string({
        error: (issue) => issue.code === 'too_small'
            ? 'Username must be at least 1 character'
            : 'Invalid username'
    }),
    age: z.number({
        error: (issue) => issue.code === 'too_small'
            ? 'Must be 18 or older'
            : 'Invalid age'
    })
});
```

## Advanced Patterns

### Reusable Schemas

```typescript
// Base schema
const baseUserSchema = z.object({
    username: z.string().min(1).max(100),
    name: z.string().min(1).max(100)
});

// Extend base schema
const registerSchema = baseUserSchema.extend({
    password: z.string().min(8),
    email: z.email()
});

// Partial schema (all optional)
const updateSchema = baseUserSchema.partial();

// Pick specific fields
const loginSchema = baseUserSchema.pick({ username: true });

// Omit specific fields
const publicUserSchema = baseUserSchema.omit({ password: true });
```

## Common Patterns for APIs

### Request Validation

```typescript
import { ZodType } from 'zod';

export class UserValidation {
    static readonly REGISTER: ZodType = z.object({
        username: z.string().min(1, 'Username required').max(100, 'Too long'),
        password: z.string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Must contain uppercase')
            .regex(/[a-z]/, 'Must contain lowercase')
            .regex(/[0-9]/, 'Must contain number'),
        name: z.string().min(1, 'Name required').max(100, 'Too long')
    });

    static readonly LOGIN: ZodType = z.object({
        username: z.string().min(1),
        password: z.string().min(1)
    });

    static readonly UPDATE: ZodType = z.object({
        name: z.string().min(1).max(100).optional(),
        password: z.string().min(8).optional()
    });
}
```

### Validation Utility

```typescript
import { ZodType } from 'zod';

export class Validation {
    static validate<T>(schema: ZodType, data: T): T {
        return schema.parse(data);
    }
}

// Usage
const validated = Validation.validate(
    UserValidation.REGISTER,
    request
);
```

---

**Source:** Context7 - /websites/zod_dev_v4
**Last Updated:** 2026-04-10
