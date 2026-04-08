# Zod 3.24 - Documentation (April 2026)

Version: **3.24.2** | Node 22 Compatible: ✅

## Overview

Zod is a TypeScript-first schema validation library with static type inference.

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
const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number');

const emailSchema = z.string().email('Invalid email');
const urlSchema = z.string().url('Invalid URL');
const uuidSchema = z.string().uuid('Invalid UUID');
```

### Object Schema

```typescript
const userSchema = z.object({
    username: z.string().min(1).max(100),
    password: z.string().min(8),
    name: z.string().min(1).max(100),
    age: z.number().optional(),
    email: z.string().email().optional()
});

// Type inference
type User = z.infer<typeof userSchema>;
// { username: string; password: string; name: string; age?: number; email?: string; }
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

### Multiple Refinement Errors

Zod continues executing all refinements even if one fails:

```typescript
const myString = z.string()
    .refine((val) => val.length > 8, { error: "Too short!" })
    .refine((val) => val === val.toLowerCase(), { error: "Must be lowercase" });

const result = myString.safeParse("OH NO");
result.error?.issues;
// [
//   { "code": "custom", "message": "Too short!" },
//   { "code": "custom", "message": "Must be lowercase" }
// ]
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

### Custom Error Messages

```typescript
const schema = z.object({
    username: z.string({
        required_error: "Username is required",
        invalid_type_error: "Username must be a string"
    }),
    age: z.number({
        required_error: "Age is required",
        invalid_type_error: "Age must be a number"
    }).min(18, { message: "Must be 18 or older" })
});
```

## Transformations

### Basic Transform

```typescript
const stringToNumber = z.string()
    .transform((val) => Number(val));

const emailSchema = z.string()
    .email()
    .transform((val) => val.toLowerCase());

const result = emailSchema.parse('JOHN@EXAMPLE.COM');
// Result: 'john@example.com' (string)
```

### Transform with Validation

```typescript
const coercedInt = z.transform((val, ctx) => {
    try {
        const parsed = Number.parseInt(String(val));
        return parsed;
    } catch (e) {
        ctx.issues.push({
            code: "custom",
            message: "Not a number",
            input: val,
        });
        return z.NEVER; // Special constant to exit transform
    }
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
    email: z.string().email()
});

// Partial schema (all optional)
const updateSchema = baseUserSchema.partial();

// Pick specific fields
const loginSchema = baseUserSchema.pick({ username: true });

// Omit specific fields
const publicUserSchema = baseUserSchema.omit({ username: true });
```

### Conditional Validation

```typescript
const schema = z.object({
    type: z.enum(['individual', 'company']),
    companyName: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional()
}).refine((data) => {
    if (data.type === 'company') {
        return !!data.companyName;
    }
    return !!(data.firstName && data.lastName);
}, {
    message: "Required fields missing based on type"
});
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

### Error Response Format

```typescript
import { ZodError } from 'zod';

export function formatZodError(error: ZodError) {
    return {
        message: 'Validation Error',
        errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message
        }))
    };
}
```

---

**Source:** Context7 - /websites/zod_dev
**Last Updated:** 2026-04-07
