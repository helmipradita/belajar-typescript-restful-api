# Belajar TypeScript RESTful API

RESTful API dengan TypeScript + Express + Prisma + MySQL, dilengkapi monitoring stack (Prometheus, Grafana, Loki, Tempo, Alloy) dan k6 load/performance testing.

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| ORM | Prisma (mysql adapter) |
| Database | MySQL 8.4 |
| Validation | Zod |
| Logging | Winston |
| Auth | JWT (Bearer) + UUID refresh token (`X-API-TOKEN` fallback) |
| Metrics | prom-client + Prometheus |
| Monitoring | Grafana, Loki, Tempo, Alloy |
| Testing | Jest + Supertest (unit/integration), k6 (load/functional) |

## Arsitektur

```mermaid
graph TB
    subgraph Application
        EX[Express API<br/>:3030]
        DB[(MySQL 8.4<br/>:3306)]
    end

    subgraph Monitoring
        PR[Prometheus<br/>:9090]
        GF[Grafana<br/>:4000]
        LK[Loki<br/>:3100]
        TP[Tempo<br/>:3200]
        AL[Alloy<br/>:12345]
    end

    subgraph Testing
        K6[k6 Test Runner]
    end

    EX -->|Prisma| DB
    EX -->|/metrics| PR
    EX -->|stdout logs| AL
    AL -->|logs| LK
    AL -->|traces| TP
    PR -->|query| GF
    LK -->|query| GF
    TP -->|query| GF
    K6 -->|HTTP requests| EX

    style EX fill:#4479a1,color:#fff
    style DB fill:#4479a1,color:#fff
    style PR fill:#e85d4a,color:#fff
    style GF fill:#f47b20,color:#fff
    style LK fill:#f5a623,color:#fff
    style TP fill:#4caf50,color:#fff
    style AL fill:#f0c040,color:#333
    style K6 fill:#7b68ee,color:#fff
```

## Quick Start

### Local Development

```bash
# 1. Buat file .env
echo 'DATABASE_URL="mysql://root:@localhost:3306/belajar_typescript_restful_api"' > .env

# 2. Install dependencies
npm install

# 3. Setup database
npx prisma migrate dev
npx prisma generate

# 4. Build & run
npm run build
npm run start
```

### Docker (Full Stack)

```bash
# Start semua service (MySQL + API + Monitoring)
docker compose up -d

# Start termasuk k6 test (pilih salah satu)
docker compose --profile k6 run --rm k6-load-test
docker compose --profile k6 run --rm k6-error-test
docker compose --profile k6 run --rm k6-functional-test
```

## API Endpoints

> Semua endpoint menggunakan prefix `/api/v1/`

### Public (tanpa auth)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/healthz` | Liveness probe (returns `OK`) |
| GET | `/api/v1/health` | Health check + DB connectivity |
| GET | `/api/v1/metrics` | Prometheus metrics |
| POST | `/api/v1/users` | Register user |
| POST | `/api/v1/users/login` | Login user → `{access_token, refresh_token}` |
| POST | `/api/v1/users/refresh` | Refresh JWT menggunakan `refresh_token` |

### Authenticated (`Authorization: Bearer <jwt>` atau `X-API-TOKEN`)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/users/current` | Get current user |
| PATCH | `/api/v1/users/current` | Update current user |
| DELETE | `/api/v1/users/current` | Logout |
| POST | `/api/v1/contacts` | Create contact |
| GET | `/api/v1/contacts/:id` | Get contact |
| PUT | `/api/v1/contacts/:id` | Update contact |
| DELETE | `/api/v1/contacts/:id` | Delete contact |
| GET | `/api/v1/contacts` | Search contacts (query: name, email, phone, page, size) |
| POST | `/api/v1/contacts/:id/addresses` | Create address |
| GET | `/api/v1/contacts/:id/addresses/:aid` | Get address |
| PUT | `/api/v1/contacts/:id/addresses/:aid` | Update address |
| DELETE | `/api/v1/contacts/:id/addresses/:aid` | Delete address |
| GET | `/api/v1/contacts/:id/addresses` | List addresses (pagination via `?page=&size=`) |

> Detail API spec: [docs/apis/user.md](docs/apis/user.md), [docs/apis/contact.md](docs/apis/contact.md), [docs/apis/address.md](docs/apis/address.md), [docs/apis/monitoring.md](docs/apis/monitoring.md)

## Project Structure

```
src/
├── app/               # Infrastructure: database, logging, metrics, tracing
├── config/            # Centralized env config (Zod) + constants (HTTP codes, messages)
├── controllers/       # Route handlers (user, contact, address, monitoring)
├── errors/            # Custom error types
├── middleware/         # Auth (JWT + X-API-TOKEN), error handler, metrics, request logger
├── models/            # Request/response DTOs
├── routes/            # Express routers (public + authenticated)
├── services/          # Business logic (user, contact, address, token)
├── types/             # TypeScript type extensions (UserRequest)
└── validations/       # Zod validation schemas

config/                # Docker monitoring stack configs
├── alloy/             # Alloy OTel collector config
├── grafana/           # Grafana dashboards & datasources
├── k6/                # k6 test scripts (3 files)
├── loki/              # Loki config
├── prometheus/        # Prometheus scrape config
└── tempo/             # Tempo tracing config

docs/apis/             # API specification docs
docs/                  # Monitoring, k6 & error handling documentation
test/                  # Jest + Supertest integration tests (5 files, 54 test cases)
├── api/               # Endpoint integration tests
├── test-util.ts       # Shared test utilities
└── test-util.test.ts  # Utility edge case tests
```

## Testing

### Unit/Integration Tests (Jest)

```bash
npm test
```

**5 test files — 54 test cases:**
- `test/api/user.test.ts` — register, login (JWT), refresh token, get (JWT + X-API-TOKEN), update, logout — **19 tests**
- `test/api/contact.test.ts` — CRUD + search + paging — **14 tests**
- `test/api/address.test.ts` — CRUD + list dengan pagination — **15 tests**
- `test/api/monitoring.test.ts` — healthz, health, metrics — **3 tests**
- `test/test-util.test.ts` — error handling edge cases — **3 tests**

### k6 Load & Performance Tests

| Test | Command | Tujuan |
|------|---------|--------|
| Load Test | `docker compose --profile k6 run --rm k6-load-test` | Performa di beban normal (20 VU, 5 menit) |
| Error Test | `docker compose --profile k6 run --rm k6-error-test` | Validasi error handling (1 VU, 1 iterasi) |
| Functional | `docker compose --profile k6 run --rm k6-functional-test` | Semua 18+ endpoint, 200 VU, 5000 iterasi |

> Detail dokumentasi: [docs/k6/](docs/k6/)

## Monitoring & Observability

| Service | URL | Kredensial |
|---------|-----|------------|
| Grafana | http://localhost:4000 | admin / admin |
| Prometheus | http://localhost:9090 | - |
| Loki | http://localhost:3100 | - |
| Tempo | http://localhost:3200 | - |
| Alloy | http://localhost:12345 | - |

> Detail monitoring: [docs/monitoring-stack.md](docs/monitoring-stack.md)

## Scripts

| Command | Deskripsi |
|---------|-----------|
| `npm run build` | Compile TypeScript ke `dist/` |
| `npm run start` | Run compiled app (port 3030 — host:3030, container:3000) |
| `npm test` | Run Jest integration tests (54 test cases) |
