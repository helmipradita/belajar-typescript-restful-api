# Perbedaan src/application/database.ts

## Current Version (48 lines)

```typescript
import {PrismaClient} from "@prisma/client";
import {logger} from "./logging";

// Limit connection pool size for test environment to avoid "too many connections" error
const connectionLimit = process.env.NODE_ENV === "test" ? 1 : undefined;

export const prismaClient = new PrismaClient({
    log: [
        {
            emit: "event",
            level: "query"
        },
        {
            emit: "event",
            level: "error"
        },
        {
            emit: "event",
            level: "info"
        },
        {
            emit: "event",
            level: "warn"
        }
    ],
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

prismaClient.$on("error", (e) => {
    logger.error(e);
})

prismaClient.$on("warn", (e) => {
    logger.warn(e);
})

prismaClient.$on("info", (e) => {
    logger.info(e);
})

prismaClient.$on("query", (e) => {
    logger.info(e);
})
```

---

## PZN Version (40 lines)

```typescript
import {PrismaClient} from "@prisma/client";
import {logger} from "./logging";

export const prismaClient = new PrismaClient({
    log: [
        {
            emit: "event",
            level: "query"
        },
        {
            emit: "event",
            level: "error"
        },
        {
            emit: "event",
            level: "info"
        },
        {
            emit: "event",
            level: "warn"
        }
    ]
});

prismaClient.$on("error", (e) => {
    logger.error(e);
})

prismaClient.$on("warn", (e) => {
    logger.warn(e);
})

prismaClient.$on("info", (e) => {
    logger.info(e);
})

prismaClient.$on("query", (e) => {
    logger.info(e);
})
```

---

## Perbedaan

| Line | Current | PZN |
|------|---------|-----|
| 4-5 | `// Limit connection pool...`<br>`const connectionLimit = ...` | ❌ Tidak ada |
| 8-30 | `datasources: { db: { url: ... } }` | ❌ Tidak ada |

---

## Analisis

### 1. Connection Pool Limit (Current)

```typescript
const connectionLimit = process.env.NODE_ENV === "test" ? 1 : undefined;
```

**Tujuan**: Membatasi jumlah koneksi database saat testing untuk menghindari error "too many connections".

**Catatan**: Variabel `connectionLimit` didefinisikan tapi tidak digunakan di PrismaClient constructor. Ini mungkin:
- Sisa dari refactoring
- Atau akan digunakan untuk konfigurasi connection limit di masa depan

### 2. Datasources Configuration (Current)

```typescript
datasources: {
    db: {
        url: process.env.DATABASE_URL
    }
}
```

**Tujuan**: Explicitly set DATABASE_URL dari environment variable.

**PZN**: Menggunakan default Prisma behavior (baca dari `.env` langsung).

**Impact**: Current lebih eksplisit dan bisa override DATABASE_URL jika perlu.

---

## Kesimpulan

Perbedaan di database.ts relatif kecil:
1. Connection pool limit untuk test (defined but not used)
2. Explicit DATABASE_URL configuration

Keduanya bukan perubahan yang "critical", tapi lebih ke best practice untuk production environment.
