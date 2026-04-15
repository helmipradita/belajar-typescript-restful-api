# Perbandingan Dua Proyek TypeScript RESTful API

**Tanggal**: 2026-04-15

Membandingkan:
- **Current**: `/home/z0nk/Developments/Labs/belajar-typescript-restful-api`
- **PZN (Original)**: `/home/z0nk/Developments/Labs/PZN/belajar-typescript-restful-api`

**Scope**: File `src/` saja (tanpa Kafka, Redis, docs, test)

---

## Ringkasan

### Hasil Utama

**File yang SAMA PERSIS** (antara Current dan PZN):

| Folder | File |
|--------|------|
| controller/ | user-controller.ts, contact-controller.ts, address-controller.ts |
| middleware/ | auth-middleware.ts, error-middleware.ts |
| model/ | user-model.ts, contact-model.ts, address-model.ts, page.ts |
| route/ | api.ts, public-api.ts |
| service/ | user-service.ts |
| validation/ | user-validation.ts, contact-validation.ts, address-validation.ts, validation.ts |
| type/ | user-request.ts |
| error/ | response-error.ts |
| application/ | logging.ts |

**File yang BERBEDA**:

| File | Perbedaan |
|------|-----------|
| main.ts | Current: 117 lines (graceful shutdown) vs PZN: 7 lines |
| application/database.ts | Current: connection pool limit untuk test |
| application/web.ts | Current: import dan use healthRouter |
| service/contact-service.ts | Current: +audit event publishing |
| service/address-service.ts | Current: +audit event publishing |

---

## Detail Perbedaan

### 1. main.ts

**PZN Version** (7 lines):
```typescript
import {web} from "./application/web";
import {logger} from "./application/logging";

web.listen(3000, () => {
    logger.info("Listening on port 3000");
})
```

**Current Version** (117 lines):
- Graceful shutdown dengan 30s timeout
- Signal handlers (SIGTERM, SIGINT, SIGUSR2)
- Proper cleanup sequence: HTTP → Kafka → Redis → DB
- Uncaught exception handler
- Server error handling (EADDRINUSE)

**Catatan**: Current version jauh lebih production-ready.

---

### 2. application/database.ts

**PZN Version**:
```typescript
export const prismaClient = new PrismaClient({
    log: [...]
});
```

**Current Version**:
```typescript
// Limit connection pool size for test environment
const connectionLimit = process.env.NODE_ENV === "test" ? 1 : undefined;

export const prismaClient = new PrismaClient({
    log: [...],
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});
```

**Perbedaan**: Current memiliki connection pool limit untuk test dan explicit DATABASE_URL.

---

### 3. application/web.ts

**PZN Version**:
```typescript
import {publicRouter} from "../route/public-api";
import {errorMiddleware} from "../middleware/error-middleware";
import {apiRouter} from "../route/api";

export const web = express();
web.use(express.json());
web.use(publicRouter);
web.use(apiRouter);
web.use(errorMiddleware);
```

**Current Version**:
```typescript
import {publicRouter} from "../route/public-api";
import {errorMiddleware} from "../middleware/error-middleware";
import {apiRouter} from "../route/api";
import {healthRouter} from "../route/health-route";  // ← NEW

export const web = express();
web.use(express.json());

web.use(healthRouter);  // ← NEW (must be first)
web.use(publicRouter);
web.use(apiRouter);
web.use(errorMiddleware);
```

**Perbedaan**: Current menambahkan health check routes.

---

### 4. service/contact-service.ts

**Perbedaan di method `create()`**:

**PZN**:
```typescript
static async create(user: User, request: CreateContactRequest): Promise<ContactResponse> {
    const createRequest = Validation.validate(ContactValidation.CREATE, request);
    const record = { ...createRequest, ...{username: user.username} };
    const contact = await prismaClient.contact.create({ data: record });
    logger.debug("record : " + JSON.stringify(contact));
    return toContactResponse(contact);
}
```

**Current**:
```typescript
static async create(user: User, request: CreateContactRequest): Promise<ContactResponse> {
    const createRequest = Validation.validate(ContactValidation.CREATE, request);
    const record = { ...createRequest, ...{username: user.username} };
    const contact = await prismaClient.contact.create({ data: record });
    logger.debug("record : " + JSON.stringify(contact));

    // ← NEW: Publish audit event (non-blocking)
    const auditEvent = createContactAuditEvent(
        "contact.created", contact.id, user.username, undefined, contact
    );
    contactProducer.publishAuditEvent(auditEvent).catch(err =>
        logger.error(`Failed to publish audit event: ${err}`)
    );

    return toContactResponse(contact);
}
```

**Perbedaan yang sama** juga ada di method `update()` dan `remove()`.

---

### 5. service/address-service.ts

Sama seperti contact-service, Current menambahkan audit event publishing di:
- `create()` - setelah create address
- `update()` - setelah update address
- `remove()` - setelah delete address

---

## File yang Hanya Ada di Current (Kafka/Redis Related)

| File | Deskripsi |
|------|-----------|
| src/application/kafka.ts | Kafka client configuration |
| src/application/redis.ts | Redis client |
| src/consumer-server.ts | Kafka consumer service entry |
| src/controller/health-controller.ts | Health check endpoints |
| src/consumer/audit-consumer.ts | Kafka consumer |
| src/producer/contact-producer.ts | Kafka producer |
| src/route/health-route.ts | Health routes |
| src/model/audit-model.ts | Audit event DTOs |

---

## File yang Hanya Ada di PZN

| File | Deskripsi |
|------|-----------|
| test/user.test.ts | User API tests (lengkap!) |
| doc/user.md | User API documentation |
| doc/contact.md | Contact API documentation |
| doc/address.md | Address API documentation |
| prisma/migrations/ | Migration files lengkap |
| prisma/migrations.sql | SQL dump |

---

## Kesimpulan

1. **Core business logic SAMA** - Controller, Service (tanpa audit), Model, Validation, Middleware semuanya identik

2. **Perbedaan utama di Current**:
   - Graceful shutdown di main.ts
   - Connection pool limit di database.ts
   - Health check routes di web.ts
   - Audit event publishing di service layer (Kafka-based)

3. **PZN lebih baik untuk learning** - Memiliki user.test.ts dan doc/ folder yang lengkap

4. **Current lebih production-ready** - Graceful shutdown, health checks, audit logging
