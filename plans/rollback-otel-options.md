# Rollback Opsi — OpenTelemetry Setup

## Daftar Isi
- [Opsi A: Auto-Instrumentasi Saja (zero code change)](#opsi-a-auto-instrumentasi-saja)
- [Opsi B: Auto + Prisma Proxy](#opsi-b-auto--prisma-proxy)
- [Cara Rollback dari B ke A](#cara-rollback-dari-b-ke-a)

---

## Opsi A: Auto-Instrumentasi Saja

**Ciri:** Hanya `getNodeAutoInstrumentations()` — cover HTTP + Express middleware.

### Trace Tree
```
GET /api/contacts
├── middleware - query
├── middleware - expressInit
├── middleware - jsonParser
├── middleware - requestIdMiddleware
├── middleware - requestLoggerMiddleware
├── middleware - metricsMiddleware
├── router - /healthz
├── router - /
├── middleware - authMiddleware
├── request handler - /api/contacts   ← cover semua app code
```

### File yang terlibat
| File | Perubahan dari base PZN |
|---|---|
| `src/app/tracing.ts` | Baru — OTEL SDK + auto-instrumentations |
| `src/main.ts` | +1 baris `import "./app/tracing"` |
| `src/middleware/request-logger-middleware.ts` | +2 baris `trace_id`/`span_id` di log |

**Zero perubahan** di controller, service, validation, database.

---

## Opsi B: Auto + Prisma Proxy

**Ciri:** Opsi A + Proxy di `database.ts` yang auto-wrap semua Prisma query.

### Trace Tree
```
GET /api/contacts
├── request handler - /api/contacts
│   ├── prisma.contact.findMany    ← auto dari Proxy
│   └── prisma.contact.count       ← auto dari Proxy
```

### File yang terlibat
| File | Perubahan dari base PZN |
|---|---|
| `src/app/tracing.ts` | Baru — OTEL SDK + auto-instrumentations |
| `src/app/database.ts` | +Proxy wrapper untuk PrismaClient |
| `src/main.ts` | +1 baris `import "./app/tracing"` |
| `src/middleware/request-logger-middleware.ts` | +2 baris `trace_id`/`span_id` di log |

**Zero perubahan** di controller, service, validation.

---

## Cara Rollback dari B ke A

### Step 1: Kembalikan `database.ts` ke base PZN
```bash
git checkout -- src/app/database.ts
```
Atau hapus Proxy wrapper, sisakan hanya:
```typescript
import { PrismaClient } from "@prisma/client";

export const prismaClient = new PrismaClient();
```

### Step 2: Tidak ada step lain
Opsi A dan B hanya beda di `database.ts`. Semua file lain sama.

---
