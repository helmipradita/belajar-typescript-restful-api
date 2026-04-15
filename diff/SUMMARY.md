# Summary: Perbedaan Core Source Code

## Hasil Perbandingan

Setelah membandingkan file-file di folder `src/` (tanpa Kafka, Redis, docs, test):

### Files yang SAMA PERSIS (21 files)

| Category | Files |
|----------|-------|
| **Controller** | user-controller.ts, contact-controller.ts, address-controller.ts |
| **Middleware** | auth-middleware.ts, error-middleware.ts |
| **Model** | user-model.ts, contact-model.ts, address-model.ts, page.ts |
| **Route** | api.ts, public-api.ts |
| **Service** | user-service.ts |
| **Validation** | user-validation.ts, contact-validation.ts, address-validation.ts, validation.ts |
| **Type** | user-request.ts |
| **Error** | response-error.ts |
| **Application** | logging.ts |

**Total: 21 files SAMA persis**

---

### Files yang BERBEDA (4 files)

| File | Perbedaan |
|------|-----------|
| **main.ts** | Current: Graceful shutdown (117 lines) vs PZN: Simple start (7 lines) |
| **application/database.ts** | Current: +connection limit, +explicit DATABASE_URL |
| **application/web.ts** | Current: +health routes, +comments |
| **service/contact-service.ts** | Current: +audit event publishing (Kafka) |
| **service/address-service.ts** | Current: +audit event publishing (Kafka) |

---

## Rincian Perbedaan

### 1. main.ts

```
PZN:    7 lines  (simple server start)
Current: 117 lines (graceful shutdown, signal handlers, error handling)
```

**Fitur tambahan Current**:
- Graceful shutdown dengan 30s timeout
- Signal handlers (SIGTERM, SIGINT, SIGUSR2)
- Server error handling (EADDRINUSE)
- Uncaught exception handler
- Unhandled promise rejection handler
- Proper cleanup sequence

### 2. application/database.ts

```
Perbedaan:
- Current: connection pool limit untuk test (defined tapi not used)
- Current: explicit DATABASE_URL configuration
```

### 3. application/web.ts

```
Perbedaan:
- Current: import healthRouter
- Current: web.use(healthRouter)
- Current: komentar dokumentatif
```

### 4. service/contact-service.ts & address-service.ts

```
Perbedaan:
- Current: audit event publishing via Kafka (create, update, remove)
- PZN: tidak ada audit
```

---

## File yang Hanya Ada di Current (Kafka/Redis/Health)

| File |
|------|
| src/application/kafka.ts |
| src/application/redis.ts |
| src/consumer-server.ts |
| src/controller/health-controller.ts |
| src/consumer/audit-consumer.ts |
| src/producer/contact-producer.ts |
| src/route/health-route.ts |
| src/model/audit-model.ts |

---

## File yang Hanya Ada di PZN (Learning/Docs)

| File |
|------|
| test/user.test.ts ← **PENTING!** |
| doc/user.md |
| doc/contact.md |
| doc/address.md |
| prisma/migrations/ |
| prisma/migrations.sql |

---

## Kesimpulan

1. **Core Business Logic SAMA** - 21 files identik

2. **Current = PZN +**:
   - Graceful shutdown
   - Health checks
   - Kafka audit logging
   - Redis caching

3. **PZN = Current -**:
   - Tanpa enterprise features
   - Memiliki user.test.ts (yang tidak ada di Current!)
   - Memiliki doc/ folder yang lengkap
   - Memgunakan Prisma migrations

4. **Rekomendasi**:
   - **Port user.test.ts dari PZN ke Current**
   - Gunakan Current sebagai production base
   - Gunakan PZN sebagai learning reference
