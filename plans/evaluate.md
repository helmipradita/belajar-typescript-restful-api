# Evaluasi Codebase — `belajar-typescript-restful-api`

## 1. ARSITEKTUR & POLA

**Layer pattern** bersih: `route → controller → service → model/validation → Prisma`. Express Router dipisah antara public (`public-api.ts`) dan authenticated (`api.ts`) via `authMiddleware`. Middleware pipeline rapi: `requestId → requestLogger → metrics → compression → cors → routes → errorHandler`.

## 2. DATABASE (Prisma + MySQL)

- **3 models**: User (PK username), Contact (auto increment, FK username), Address (auto increment, FK contact_id)
- Prisma client di-`emit` event query/error/info/warn untuk logging.

## 3. VALIDATION (Zod)

Semua input tervalidasi (register, login, update user, contact CRUD, address CRUD, search, refresh token).

## 4. AUTHENTICATION

- **Hybrid auth**: JWT (Bearer) untuk access token + UUID di DB untuk refresh token
- **Login** mengembalikan `{access_token, refresh_token}`
- **Access token**: JWT, short-lived (15 menit), stateless
- **Refresh token**: UUID, disimpan di DB, bisa di-revoke via logout
- **Fallback**: `X-API-TOKEN` header untuk backward compatibility

## 5. MONITORING STACK

9 service via Docker Compose:
- **MySQL 8.4** — database
- **rest-api** — Express (port host 3030:3000)
- **Prometheus** — scrape `/api/v1/metrics`, Alloy, Tempo metrics generator
- **Grafana** — dashboard Prometheus + Loki + Tempo (port 4000)
- **Loki** — log aggregation (30d retention via compactor)
- **Tempo** — distributed tracing (OTLP via Alloy, 24h block retention)
- **Alloy** — OTel collector (Docker socket + file logs → Loki, traces → Tempo)
- **3 k6 scripts** — load-test.js, error-test.js, functional-test.js

## 6. METRICS

`prom-client` dengan `collectDefaultMetrics()`, `http_requests_total`, `http_request_duration_seconds`.

## 7. LOGGING

Winston JSON ke stdout + file (daily rotation, 14d retention), di-collect Alloy → Loki. Setiap request log: request_id, method, path, status, latency.

## 8. ERROR HANDLING

- `ZodError` → 400 (format array `{path, message}`)
- `ResponseError` → custom status code
- `PrismaClientKnownRequestError` → P2002 (409), P2025 (404), default (400)
- Generic error → 500

## 9. TEST COVERAGE

**54 test cases — 5 test files:**
- `test/api/user.test.ts` — register, login, refresh token, get (JWT + X-API-TOKEN), update, logout
- `test/api/contact.test.ts` — CRUD + search + paging
- `test/api/address.test.ts` — CRUD + list dengan pagination
- `test/api/monitoring.test.ts` — healthz, health, metrics
- `test/test-util.test.ts` — edge case utility error handling

## 10. FITUR TELAH DIIMPLEMENTASIKAN

- API Versioning `/api/v1/`
- JWT Access Token (Bearer) + UUID Refresh Token
- Refresh Token endpoint `POST /api/v1/users/refresh`
- Auth via `Authorization: Bearer` or `X-API-TOKEN` (fallback)
- Pagination Address List
- Unique Constraint Token
- Trace-Log Correlation (OpenTelemetry → Tempo)
- Request Body Size Limit via `BODY_LIMIT` env
- Response compression (gzip)
- CORS dengan configurable origin via `CORS_ORIGIN` env
- File logging dengan daily rotation + 14d retention, host volume mount
- Husky + lint-staged pre-commit (tsc --noEmit)
- Dockerfile optimized (2 stage, single npm ci)
- Post Create → 201
- Production Error Detail Hide (NODE_ENV)
- Standardized error response (array of `{message}` / `{path, message}`)
- Centralized env config with Zod validation (`src/config/env.ts`)
- Centralized constants (`src/config/constants.ts`): HTTP codes + messages
- Graceful shutdown (SIGTERM/SIGINT handling)
- Error logging (unhandledRejection, uncaughtException)
- Alloy file log scraping (`loki.source.file` for `logs/*.log`)
- Loki compactor + 30d retention
- Tempo 24h block retention
- Prometheus multi-target scraping (rest-api + alloy + tempo)
- Grafana Logs panel with Loki datasource
- Grafana dashboard autoprovisioned with Tempo datasource
- Docker compose volume mount untuk logs/
- k6 auth fix: X-API-TOKEN → Bearer JWT

## 11. SISA / HOLD (BELUM DIIMPLEMENTASIKAN)

- Rate limiting (belum prioritas)
- Contact search single query optimization
- PM2 cluster mode (scaling level 2)
- Horizontal scale multi-container + Nginx (scaling level 3)
- Redis in-memory cache (refresh tokens + search)

## 12. PERFORMANCE BOTTLENECKS

| Bottleneck | Detail |
|---|---|
| Connection pool | Prisma default 10 (udah di-tuning ke 30) |
| Single process | Express 1 thread |
| Auth query | Refresh token masih query DB |
| No in-memory cache | Tidak ada Redis |
| Search 2 queries | findMany + count terpisah |

## 13. ENHANCEMENT SUGGESTIONS (FUTURE)

| # | Enhancement | Package | Alasan |
|---|-------------|---------|--------|
| 1 | Security headers | `helmet` | Security headers (XSS, CSP, dll) — standar production API |
| 2 | API Docs (Swagger/OpenAPI) | `swagger-jsdoc` + `swagger-ui-express` | Dokumentasi interaktif, auto-sync dengan code |
| 3 | CI/CD GitHub Actions | — | Auto lint, test, build, deploy tiap push |
| 4 | Response validation | Zod output schema | Safety net biar response sesuai kontrak |
| 5 | Error tracking | `@sentry/node` | Capture error production, traceability |
| 6 | Caching (Redis) | `redis` / `ioredis` | Cache refresh tokens + search results, kurangi DB load |
| 7 | PM2 ecosystem file | `pm2` | Multi-process, auto-restart, zero-downtime |
