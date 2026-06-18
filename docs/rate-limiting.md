# Rate Limiting

## Overview

Rate limiting melindungi REST API dari penyalahgunaan dengan membatasi jumlah request dalam jangka waktu tertentu. Implementasi menggunakan **3-tier sliding window** berbasis Redis.

| Tier | Target | Basis Key | Window | Default Max | Melindungi Dari |
|------|--------|-----------|--------|-------------|-----------------|
| **Global** | Semua endpoint (kecuali health/metrics) | IP address | 1 menit | 60 | Abuse umum dari 1 IP |
| **Auth** | `POST /users`, `/login`, `/refresh` | IP address | 15 menit | 20 | Brute force credential stuffing |
| **API** | Semua authenticated routes | Username (dari JWT) | 15 menit | 500 | API scraping per-user |

## Tech Stack

| Komponen | Teknologi | Fungsi |
|----------|-----------|--------|
| Middleware | `express-rate-limit` ^7.5 | Sliding window rate limiter untuk Express |
| Redis Store | `rate-limit-redis` ^4.2 | Backend Redis agar rate limit state **shared** antar instance |
| Redis Client | `ioredis` ^5.7 | Koneksi Redis dengan reconnect strategy |
| Redis Server | `redis:7-alpine` via Docker | In-memory data store untuk counter |
| Metrics | `rate_limit_blocked_total` counter | Monitoring jumlah request yang di-block |

### Package Dependencies

```json
{
  "dependencies": {
    "express-rate-limit": "^7.5.0",
    "rate-limit-redis": "^4.2.0",
    "ioredis": "^5.7.0"
  }
}
```

## Architecture & Flow

### Middleware Pipeline

```mermaid
flowchart TB
    subgraph "Middleware Pipeline (order in app.ts)"
        direction TB
        A["1. express.json()"] --> B["2. compression()"]
        B --> C["3. cors()"]
        C --> D["4. requestIdMiddleware"]
        D --> E["5. requestLoggerMiddleware"]
        E --> F["6. metricsMiddleware"]
        F --> G["7. ✅ globalLimiter ★ NEW"]
        G --> H{"Route type?"}
    end

    subgraph "Public Routes"
        H -->|healthz/health/metrics| I["Skip rate limit<br/>(infrastructure)"]
        I --> I1["MonitoringController"]
        H -->|users (auth)| J["8. authLimiter<br/>2 req / 15 menit per IP"]
        J --> J1["UserController<br/>register / login / refresh"]
    end

    subgraph "Protected Routes"
        H -->|contacts/addresses| K["8. authMiddleware<br/>JWT Bearer / X-API-TOKEN"]
        K --> L["9. apiLimiter<br/>500 req / 15 menit per user"]
        L --> M["ContactController / AddressController"]
    end

    style G fill:#4caf50,color:#fff
    style J fill:#ff9800,color:#fff
    style L fill:#2196f3,color:#fff
```

### Redis Key Namespace

Setiap key di Redis menggunakan prefix `{APP_NAME}:ratelimit:{tier}:` untuk menghindari bentrok jika Redis digunakan bersama project lain.

```
{APP_NAME}:ratelimit:global:{ip}
{APP_NAME}:ratelimit:auth:{ip}
{APP_NAME}:ratelimit:api:{username}
```

Contoh konkret:

```
belajar-typescript-restful-api:ratelimit:global:192.168.1.100
belajar-typescript-restful-api:ratelimit:auth:10.0.0.55
belajar-typescript-restful-api:ratelimit:api:eko
```

## Rate Limit Response

Ketika request melebihi batas, API merespon dengan HTTP 429:

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1718726400
Retry-After: 60
Content-Type: application/json

{
  "errors": [
    {"message": "Too many login attempts, please try again later"}
  ]
}
```

### Pesan Error per Tier

| Tier | Response Message |
|------|-----------------|
| Global | `Too many requests, please try again later` |
| Auth | `Too many login attempts, please try again later` |
| API | `Too many requests, please slow down` |

### Standard Headers

Setiap response menyertakan `X-RateLimit-*` headers (via `express-rate-limit` standardHeaders):

| Header | Contoh | Arti |
|--------|--------|------|
| `X-RateLimit-Limit` | `20` | Maximum request dalam window |
| `X-RateLimit-Remaining` | `15` | Sisa request yang tersedia |
| `X-RateLimit-Reset` | `1718726400` | Unix timestamp ketika counter di-reset |
| `Retry-After` | `60` | Detik yang harus ditunggu sebelum coba lagi |

## Source Code

### Rate Limit Configuration

File: `src/config/rate-limit.ts`

```typescript
import { env } from "./env";

export const RATE_LIMIT = {
    GLOBAL: {
        WINDOW_MS: env.RATE_LIMIT_GLOBAL_WINDOW_MS,
        MAX: env.RATE_LIMIT_GLOBAL_MAX,
        KEY_PREFIX: `${env.APP_NAME}:ratelimit:global:`,
    },
    AUTH: {
        WINDOW_MS: env.RATE_LIMIT_AUTH_WINDOW_MS,
        MAX: env.RATE_LIMIT_AUTH_MAX,
        KEY_PREFIX: `${env.APP_NAME}:ratelimit:auth:`,
    },
    API: {
        WINDOW_MS: env.RATE_LIMIT_API_WINDOW_MS,
        MAX: env.RATE_LIMIT_API_MAX,
        KEY_PREFIX: `${env.APP_NAME}:ratelimit:api:`,
    },
};
```

### Rate Limit Middleware

File: `src/middleware/rate-limit-middleware.ts`

```typescript
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "../app/redis";
import { RATE_LIMIT } from "../config/rate-limit";
import { env } from "../config/env";
import { logger } from "../app/logging";
import { rateLimitBlockedTotal } from "../app/metrics";

// Redis store — prefix key per tier
function createStore(prefix: string) {
    return new RedisStore({
        prefix,
        sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)),
    });
}

// Handler ketika kena limit — log + Prometheus counter
function createOnLimitReached(tier: string) {
    return (req: Request) => {
        logger.warn({ event: "rate_limit.exceeded", tier, method: req.method, path: req.path });
        rateLimitBlockedTotal.inc({ tier, method: req.method, route: req.path });
    };
}

// Tier 1 — Global (per-IP, skip health/metrics)
export const globalLimiter = rateLimit({ ... });

// Tier 2 — Auth (per-IP, strict)
export const authLimiter = rateLimit({ ... });

// Tier 3 — API (per-user, dari JWT username)
export const apiLimiter = rateLimit({ ... });
```

### Redis Client

File: `src/app/redis.ts`

```typescript
import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "./logging";

export const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        if (times > 5) {
            logger.error({ event: "redis.retry_exhausted", attempts: times });
            return null;
        }
        return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
    enableReadyCheck: true,
});

redis.on("connect", () => logger.info({ event: "redis.connected" }));
redis.on("error", (err) => logger.error({ event: "redis.error", error: err.message }));
redis.on("close", () => logger.warn({ event: "redis.closed" }));
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_NAME` | ❌ (ada default) | `belajar-typescript-restful-api` | Prefix untuk Redis key — cegah bentrok |
| `REDIS_URL` | ✅ | — | URL koneksi Redis (`redis://host:port`) |
| `RATE_LIMIT_ENABLED` | ❌ | `true` | Master switch; `false` skip semua rate limiter |
| `RATE_LIMIT_GLOBAL_MAX` | ❌ | `60` | Max request per IP per window (global) |
| `RATE_LIMIT_GLOBAL_WINDOW_MS` | ❌ | `60000` | Window size global dalam ms |
| `RATE_LIMIT_AUTH_MAX` | ❌ | `20` | Max login attempt per IP per window |
| `RATE_LIMIT_AUTH_WINDOW_MS` | ❌ | `900000` (15 menit) | Window size auth dalam ms |
| `RATE_LIMIT_API_MAX` | ❌ | `500` | Max API call per user per window |
| `RATE_LIMIT_API_WINDOW_MS` | ❌ | `900000` (15 menit) | Window size API dalam ms |

### Redis Key Prefix

`APP_NAME` memastikan key Redis tidak bentrok antar project yang sharing Redis server yang sama:

| Project | Auth Key |
|---------|----------|
| belajar-typescript-restful-api | `belajar-typescript-restful-api:ratelimit:auth:1.2.3.4` |
| project-lain | `project-lain:ratelimit:auth:1.2.3.4` |

### Development & Test

```bash
# Development — Redis jalan, rate limit AKTIF
RATE_LIMIT_ENABLED=true
RATE_LIMIT_AUTH_MAX=20

# Debugging — Redis jalan, tapi rate limit SKIP semua
RATE_LIMIT_ENABLED=false

# Jest test — via test-util.ts, otomatis set RATE_LIMIT_ENABLED=false
# (Rate limit logic diuji via k6, bukan Jest)
```

## Testing with k6

### Skenario Load Test (20 VU)

Rate limit perlu dinaikkan untuk k6 test karena VU banyak dari IP yang sama. Di docker-compose:

```yaml
rest-api:
  environment:
    RATE_LIMIT_ENABLED: "true"
    RATE_LIMIT_GLOBAL_MAX: "10000"   # Naikin untuk k6
    RATE_LIMIT_AUTH_MAX: "10000"
    RATE_LIMIT_API_MAX: "100000"
```

### k6 Script — Uji Rate Limit Manual

```javascript
// Config k6 untuk test rate limit: kirim banyak request cepat
export const options = {
  vus: 1,
  duration: '5s',
};

export default function () {
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/v1/users/current`, null, { headers: AUTH_HEADERS }],
    ['GET', `${BASE_URL}/api/v1/users/current`, null, { headers: AUTH_HEADERS }],
    ['GET', `${BASE_URL}/api/v1/users/current`, null, { headers: AUTH_HEADERS }],
    ['GET', `${BASE_URL}/api/v1/users/current`, null, { headers: AUTH_HEADERS }],
  ]);

  for (const res of responses) {
    check(res, {
      'is 200 or 429': (r) => r.status === 200 || r.status === 429,
    });
  }
}
```

## Grafana Monitoring

Rate limit metrics tersedia via Prometheus:

```promql
# Rate limit blocked per detik
rate(rate_limit_blocked_total[1m])

# Top endpoint yang kena block
topk(5, sum by(route) (rate(rate_limit_blocked_total[5m])))
```

## Cara Menjalankan

```bash
# Redis standalone
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Dengan compose (Redis included)
docker compose up -d redis rest-api

# Cek log rate limit
docker compose logs rest-api | grep rate_limit
```

## Graceful Shutdown

Redis ditutup dengan urutan yang benar saat aplikasi shutdown:

```
SIGTERM/SIGINT
  → server.close()
  → prismaClient.$disconnect()
  → redis.quit()
  → shutdownTracing()
  → process.exit(0)
```

Source: `src/main.ts`

---

> **Catatan:** Rate limiter di-skip untuk endpoint `/healthz`, `/health`, `/metrics` karena dipanggil oleh Docker healthcheck dan Prometheus scrape secara otomatis. Jika endpoint ini di-rate-limit, Docker akan restart container dan Grafana kehilangan data.
