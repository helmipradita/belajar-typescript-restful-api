# Prisma 7 - Documentation (April 2026)

Version: **7.0+** | Node 22 Compatible: ✅

## Overview

Prisma is a next-generation ORM for Node.js and TypeScript with type-safe database access, auto-migration, and a GUI (Prisma Studio).

## Client Setup

### Initialize Client

```typescript
import { PrismaClient } from '@prisma/client';

export const prismaClient = new PrismaClient({
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' }
    ]
});

// Optional: Listen to query logs
prismaClient.$on('query', (e) => {
    console.log('Query: ' + e.query);
    console.log('Params: ' + e.params);
    console.log('Duration: ' + e.duration + 'ms');
});
```

### Graceful Shutdown

```typescript
import { prismaClient } from './database';

async function disconnectDatabase(): Promise<void> {
    try {
        await prismaClient.$disconnect();
        console.log('Database disconnected');
    } catch (error) {
        console.error('Error disconnecting:', error);
        process.exit(1);
    }
}

process.on('SIGINT', disconnectDatabase);
process.on('SIGTERM', disconnectDatabase);
```

## Schema Definition

### Basic Schema

```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
}
```

### Generate Prisma Client

```bash
npx prisma generate
```

## Queries

### Create

```typescript
// Single record
const user = await prisma.user.create({
    data: {
        username: 'john',
        email: 'john@example.com',
        name: 'John Doe'
    }
});

// With nested create
const userWithContacts = await prisma.user.create({
    data: {
        username: 'john',
        contacts: {
            create: [
                { first_name: 'Jane', email: 'jane@example.com' },
                { first_name: 'Bob', email: 'bob@example.com' }
            ]
        }
    },
    include: { contacts: true }
});
```

### Read

```typescript
// Find unique
const user = await prisma.user.findUnique({
    where: { username: 'john' }
});

// Find first
const user = await prisma.user.findFirst({
    where: { email: 'john@example.com' }
});

// Find many
const users = await prisma.user.findMany({
    where: { name: { contains: 'John' } },
    take: 10,
    skip: 0,
    orderBy: { createdAt: 'desc' }
});

// With relations
const userWithContacts = await prisma.user.findUnique({
    where: { username: 'john' },
    include: { contacts: true }
});
```

### Update

```typescript
// Update single
const user = await prisma.user.update({
    where: { username: 'john' },
    data: { name: 'John Smith' }
});

// Update many
const result = await prisma.user.updateMany({
    where: { role: 'USER' },
    data: { status: 'ACTIVE' }
});

// Upsert
const user = await prisma.user.upsert({
    where: { username: 'john' },
    update: { name: 'John Smith' },
    create: { username: 'john', name: 'John Doe' }
});
```

### Delete

```typescript
// Delete single
await prisma.user.delete({
    where: { username: 'john' }
});

// Delete many
const result = await prisma.user.deleteMany({
    where: { status: 'INACTIVE' }
});
```

### Count

```typescript
const count = await prisma.user.count();
const countFiltered = await prisma.user.count({
    where: { status: 'ACTIVE' }
});
```

## Transactions

### Sequential Operations

```typescript
const result = await prisma.$transaction([
    prisma.user.update({
        where: { username: 'john' },
        data: { balance: { decrement: 100 } }
    }),
    prisma.user.update({
        where: { username: 'jane' },
        data: { balance: { increment: 100 } }
    })
]);
```

### Transaction with Callback

```typescript
const transfer = await prisma.$transaction(async (tx) => {
    const sender = await tx.user.update({
        where: { username: 'john' },
        data: { balance: { decrement: 100 } }
    });

    const receiver = await tx.user.update({
        where: { username: 'jane' },
        data: { balance: { increment: 100 } }
    });

    return { sender, receiver };
});
```

## Error Handling

### Common Error Codes

| Code | Description |
|------|-------------|
| P2002 | Unique constraint failed |
| P2025 | Record not found |
| P2003 | Foreign key constraint failed |
| P2011 | Null constraint violation |
| P2014 | Required relation violation |

### Handling Errors

```typescript
import { Prisma } from '@prisma/client';

try {
    await prisma.user.create({
        data: { email: 'duplicate@email.com', name: 'User' }
    });
} catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation
        if (error.code === 'P2002') {
            const field = error.meta?.target as string[];
            console.error(`Unique constraint failed on: ${field?.join(', ')}`);
        }
        // Record not found
        if (error.code === 'P2025') {
            console.error('Record not found');
        }
    }
}
```

---

**Source:** Context7 - /prisma/prisma
**Last Updated:** 2026-04-10
