# PZN Divergence

Daftar perubahan dari base project **Programmer Zaman Now (PZN) — belajar-typescript-restful-api** terhadap project ini (`final-belajar-typescript-restful-api`).

> Base repo: `/home/z0nk/Developments/BASE/GITHUB/ProgrammerZamanNow/TYPESCRIPT/belajar-typescript-restful-api`

---

## 1. Routing & Versioning

| Base PZN | Project Ini | Alasan |
|----------|-------------|--------|
| Routes tanpa prefix | `/api/v1/` prefix via `app.ts` | Versioning terpusat, gampang nambah v2 |
| Monitoring routes di root (`/healthz`) | Juga di `/api/v1/healthz` | Konsisten, semua endpoint pake prefix |

**Files:**
- `src/routes/public-api.ts`
- `src/routes/api.ts`
- `src/app/app.ts`

---

## 2. Authentication

| Base PZN | Project Ini | Alasan |
|----------|-------------|--------|
| UUID token via `X-API-TOKEN` | JWT Bearer + UUID Refresh Token | Stateless access token, refresh token via UUID di DB |
| Login return `token` | Login return `{access_token, refresh_token}` | Hybrid auth — JWT untuk request cepat, UUID untuk refresh |
| — | `POST /api/v1/users/refresh` | Endpoint untuk refresh access token |
| — | `X-API-TOKEN` fallback | Backward compatibility |

**Files:**
- `src/services/token-service.ts`
- `src/middleware/auth-middleware.ts`
- `src/controllers/user-controller.ts`
- `src/services/user-service.ts`

---

## 3. Error Handling

| Base PZN | Project Ini | Alasan |
|----------|-------------|--------|
| `errors: "string"` | `errors: [{message}]` atau `[{path, message}]` | Frontend bisa `.map()` tanpa ngecek tipe data |
| Hanya ZodError | ZodError + ResponseError + Prisma + Generic | Standardisasi semua error type |

**Files:**
- `src/middleware/error-middleware.ts`
- `src/errors/response-error.ts`

---

## 4. Environment & Config

| Base PZN | Project Ini | Alasan |
|----------|-------------|--------|
| `process.env` langsung | `src/config/env.ts` — Zod validation | Type safety, error di startup kalo env kurang |
| Hardcoded status/message | `src/config/constants.ts` — `HTTP.*`, `MESSAGE.*` | DRY, konsisten |

**Files:**
- `src/config/env.ts`
- `src/config/constants.ts`
- `.env`
- `.env.example`

---

## 5. Folder Structure

| Base PZN | Project Ini | Alasan |
|----------|-------------|--------|
| `src/application/` | `src/app/` | Nama lebih jelas untuk infrastructure |
| `src/controller/` | `src/controllers/` | Plural — standard industry |
| `src/service/` | `src/services/` | Plural — standard industry |
| `src/model/` | `src/models/` | Plural — standard industry |
| `src/route/` | `src/routes/` | Plural — standard industry |
| `src/validation/` | `src/validations/` | Plural — standard industry |
| `src/type/` | `src/types/` | Plural, udah dari base |
| `src/error/` | `src/errors/` | Plural, udah dari base |

---

## 6. Test Structure

| Base PZN | Project Ini | Alasan |
|----------|-------------|--------|
| `test/*.test.ts` (flat) | `test/api/*.test.ts` | Mirror src structure — integration test khusus endpoint |
| — | `test/test-util.ts` | Shared utilities untuk test |
| — | `test/test-util.test.ts` | Edge case coverage |

---

## 7. Docker & Infrastructure

| Base PZN | Project Ini | Alasan |
|----------|-------------|--------|
| — (no Docker) | `docker-compose.yaml` | Full stack monitoring |
| — | `Dockerfile` (2 stage) | Production image |
| — | `docker-entrypoint.sh` | Auto-migration + start |
| — | `docker-healthcheck.sh` | Stack health check |
| — | `config/prometheus/`, `grafana/`, dll | Monitoring stack configs |

---

## 8. Error Format Detail

```typescript
// Validation error (Zod)
{ errors: [{ path: "email", message: "Invalid email" }] }

// Business/DB/Auth error
{ errors: [{ message: "Contact not found" }] }
```

---

## 9. Monitoring Stack

| Service | Port | Fungsi |
|---------|------|--------|
| Prometheus | 9090 | Metrics scrape |
| Grafana | 4000 | Dashboard |
| Loki | 3100 | Log aggregation |
| Tempo | 3200 | Distributed tracing |
| Alloy | 12345 | OTel collector |

Semua service via Docker Compose. Prometheus scrape `/api/v1/metrics`.

---

## Sync History

| Tanggal | Perubahan |
|---------|-----------|
| 2026-06-11 | Folder rename (plural + lib), port 3030, error standardization |
| 2026-06-11 | Refresh token, JWT Bearer auth, centralized config |
| 2026-06-11 | Docker monitoring stack, test coverage 54 tests |
