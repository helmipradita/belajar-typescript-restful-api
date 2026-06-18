# System Architecture — `belajar-typescript-restful-api`

Blueprint menyeluruh arsitektur, alur data, komponen, dan observability stack.

## Project Overview

**RESTful Contact Management API** — TypeScript + Express + Prisma + MySQL dengan full observability stack (Prometheus, Grafana, Loki, Tempo, Alloy) dan load testing (k6).

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 (TypeScript 5.3) |
| Framework | Express 4.18 |
| Database | MySQL 8.4 via Prisma ORM 5.10 |
| Auth | JWT (access token) + UUID (refresh token) |
| Validation | Zod 3.22 |
| Logging | Winston 3.11 + daily-rotate-file |
| Metrics | prom-client (Prometheus text format) |
| Tracing | OpenTelemetry SDK → OTLP |
| Container | Docker multi-stage build |
| Observability | Prometheus + Grafana + Loki + Tempo + Alloy |
| Load Test | k6 (functional, error, load scenarios) |

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Internet / Client"
        USER[User / HTTP Client<br/>curl, REST Client, Browser]
        K6[k6 Load Tester]
    end

    subgraph "Docker Host — Port 3030"
        direction TB
        API["rest-api<br/>Express :3000<br/>Node.js 20"]
        MW[("Middleware Pipeline<br/>5 middleware")]
    end

    subgraph "Database Layer"
        DB[(MySQL 8.4<br/>:3306)]
    end

    subgraph "Observability Stack"
        direction TB
        P[Prometheus<br/>:9090]
        G[Grafana<br/>:4000]
        L[Loki<br/>:3100]
        T[Tempo<br/>:3200]
        AL[Alloy Collector<br/>:12345]
    end

    USER -->|HTTP :3030| API
    K6 -->|load test| API
    API -->|Prisma ORM| DB
    API -->|OTLP traces| AL
    API -->|/metrics| P
    API -->|stdout + file logs| AL
    AL -->|forward traces| T
    AL -->|forward logs| L
    P -->|datasource| G
    L -->|datasource| G
    T -->|datasource| G
    T -->|metrics generator<br/>remote write| P

    style API fill:#4caf50,color:#fff
    style DB fill:#4479a1,color:#fff
    style P fill:#e85d4a,color:#fff
    style G fill:#f47b20,color:#fff
    style L fill:#f5a623,color:#fff
    style T fill:#4caf50,color:#fff
    style AL fill:#f0c040,color:#333
    style K6 fill:#7b68ee,color:#fff
```

---

## 2. Application Initialization Sequence

```mermaid
sequenceDiagram
    participant ENV as config/env.ts
    participant OTel as app/tracing.ts
    participant APP as app/app.ts
    participant DB as app/database.ts
    participant LOG as app/logging.ts
    participant MET as app/metrics.ts
    participant SRV as server (main.ts)

    Note over SRV: Startup Order
    SRV->>ENV: 1. Load dotenv + Zod validation
    ENV-->>SRV: parsed env vars or exit(1)
    SRV->>OTel: 2. Init OpenTelemetry SDK
    OTel-->>SRV: NodeSDK started (if enabled)
    SRV->>APP: 3. Create Express app
    APP->>APP: mount middleware stack
    APP->>APP: mount publicRouter + apiRouter
    APP->>APP: mount errorMiddleware
    SRV->>DB: 4. Create PrismaClient
    DB->>DB: attach query/error listeners
    DB->>DB: wrap operations in OTel spans
    SRV->>LOG: 5. Create Winston logger
    LOG->>LOG: console + daily-rotate-file transports
    SRV->>MET: 6. Create Prometheus registry
    MET->>MET: collectDefaultMetrics
    MET->>MET: create http_requests_total + histogram
    SRV->>SRV: 7. server.listen(PORT)
    SRV->>SRV: register SIGTERM/SIGINT handlers
    SRV->>SRV: register unhandledRejection/uncaughtException
```

---

## 3. HTTP Request Lifecycle

```mermaid
flowchart TB
    subgraph "1. INCOMING REQUEST"
        A[HTTP Request] --> B[express.json<br/>body parser with limit]
        B --> C[compression<br/>gzip response]
        C --> D[cors<br/>allow origins]
    end

    subgraph "2. MIDDLEWARE PIPELINE"
        D --> E[requestIdMiddleware<br/>assign x-request-id]
        E --> F[requestLoggerMiddleware<br/>record start time]
        F --> G[metricsMiddleware<br/>record start time]
    end

    subgraph "3. ROUTING"
        G --> H{Route matches?}
        H -->|public route| I[publicRouter]
        H -->|protected route| J[authMiddleware]
        J --> K{Auth valid?}
        K -->|yes| L[apiRouter]
        K -->|no| M[401 Unauthorized]
    end

    subgraph "4. CONTROLLER → SERVICE → VALIDATION → DB"
        I --> N[Controller]
        L --> N
        N --> O[Validation.validate<br/>Zod schema.parse]
        O --> P{Valid?}
        P -->|no| Q[Throws ZodError → 400]
        P -->|yes| R[Service]
        R --> S[Prisma Query<br/>with OTel span]
        S --> T[(MySQL)]
    end

    subgraph "5. RESPONSE"
        T --> U[toResponse mapper]
        U --> V[Controller sends JSON]
        V --> W[requestLogger logs<br/>event + latency]
        W --> X[metrics records<br/>counter + histogram]
        X --> Y[HTTP Response]
    end

    subgraph "ERROR PATH"
        Q --> Z[errorMiddleware]
        M --> Z
        S -->|Prisma error| AA[PrismaClientKnownError]
        AA --> Z
        R -->|ResponseError| AB[Custom error]
        AB --> Z
        Z --> AC[Log error + trace_id]
        AC --> AD[JSON error response]
    end

    style A fill:#4caf50,color:#fff
    style Y fill:#4caf50,color:#fff
    style M fill:#f44336,color:#fff
    style Q fill:#ff9800,color:#fff
    style AD fill:#f44336,color:#fff
    style J fill:#2196f3,color:#fff
```

---

## 4. Authentication Flow

```mermaid
flowchart TB
    REQ[Incoming Request<br/>to protected route] --> H{Has Authorization<br/>Bearer header?}

    H -->|YES| JWT[Extract token<br/>after Bearer ]
    JWT --> VER[TokenService.verifyAccessToken<br/>jwt.verify with secret]
    VER --> OK{JWT valid?}

    OK -->|YES| LOOKUP[prismaClient.user.findUnique<br/>by username from JWT payload]
    LOOKUP --> FOUND{User exists?}
    FOUND -->|YES| SET[req.user = user<br/>next()]
    FOUND -->|NO| 401A[401 Unauthorized]

    OK -->|NO| 401A

    H -->|NO| XAPI{Has X-API-TOKEN<br/>header?}

    XAPI -->|YES| DBB[prismaClient.user.findFirst<br/>where token = x-api-token]
    DBB --> USER{User found?}
    USER -->|YES| SET
    USER -->|NO| 401A

    XAPI -->|NO| 401A

    SET --> HANDLER[Route handler executes]

    style JWT fill:#2196f3,color:#fff
    style 401A fill:#f44336,color:#fff
    style SET fill:#4caf50,color:#fff
```

---

## 5. Error Handling Decision Tree

```mermaid
flowchart TB
    ERR[Error thrown<br/>anywhere in pipeline] --> LOG[logger.error<br/>request_id + trace_id + stack]
    LOG --> TYPE{Error type?}

    TYPE -->|ZodError| ZOD[Response 400]
    ZOD --> ZRES[{errors: [{path, message}]}]

    TYPE -->|ResponseError<br/>custom status| CUST[Response custom status]
    CUST --> CRES[{errors: [{message}]}]

    TYPE -->|Prisma.PrismaClientKnownRequestError| PRISMA{Error code?}
    PRISMA -->|P2002<br/>unique constraint| P2002[Response 409]
    P2002 --> P2RES[{errors: [{message: Resource already exists}]}]
    PRISMA -->|P2025<br/>record not found| P2025[Response 404]
    P2025 --> P5RES[{errors: [{message: Resource not found}]}]
    PRISMA -->|other| PDEF[Response 400]
    PDEF --> PDRES[{errors: [{message: Database request error}]}]

    TYPE -->|Generic Error| GEN{Node environment?}
    GEN -->|production| G500[Response 500]
    G500 --> GRES[{errors: [{message: Internal server error}]}]
    GEN -->|development| GDEV[Response 500]
    GDEV --> GDRES[{errors: [{message: actual error message}]}]

    style LOG fill:#ff9800,color:#fff
    style ZOD fill:#ff9800,color:#fff
    style CUST fill:#2196f3,color:#fff
    style P2002 fill:#f44336,color:#fff
    style P2025 fill:#f44336,color:#fff
    style G500 fill:#f44336,color:#fff
```

---

## 6. API Endpoints & Data Flow

### Public Routes (No Auth Required)

```mermaid
flowchart LR
    subgraph Monitoring
        HZ["GET /api/v1/healthz"] -->|"200 OK"| HZR[returns plain text OK]
        H["GET /api/v1/health"] -->|"200 healthy"| HR[{status: healthy}]
        H -->|"503 unhealthy"| HR2[{status: unhealthy, errors}]
        M["GET /api/v1/metrics"] -->|"200"| MR[Prometheus text format metrics]
    end

    subgraph Auth
        REG["POST /api/v1/users<br/>register"] -->|"201"| REGR[{data: {username, name}}]
        REG -->|"400"| REGE[{errors: username exists}]
        LOG["POST /api/v1/users/login"] -->|"200"| LOGR[{data: {access_token, refresh_token}}]
        LOG -->|"401"| LOGE[{errors: wrong credentials}]
        REF["POST /api/v1/users/refresh"] -->|"200"| REFR[{data: new tokens}]
        REF -->|"401"| REFE[{errors: invalid refresh token}]
    end
```

### Protected Routes (Auth Required)

```mermaid
flowchart LR
    subgraph User
        GU["GET /api/v1/users/current"] -->|"200"| GUR[{data: {username, name}}]
        UU["PATCH /api/v1/users/current"] -->|"200"| UUR[{data: updated profile}]
        LU["DELETE /api/v1/users/current"] -->|"200"| LUR[{data: OK}]
    end

    subgraph Contact
        CC["POST /api/v1/contacts"] -->|"201"| CCR[{data: contact}]
        GC["GET /api/v1/contacts/:id"] -->|"200"| GCR[{data: contact}]
        UC["PUT /api/v1/contacts/:id"] -->|"200"| UCR[{data: updated contact}]
        DC["DELETE /api/v1/contacts/:id"] -->|"200"| DCR[{data: OK}]
        SC["GET /api/v1/contacts<br/>?name=&email=&page=&size="] -->|"200"| SCR[{data: [...], paging: {...}}]
    end

    subgraph Address
        CA["POST /api/v1/contacts/:id/addresses"] -->|"201"| CAR[{data: address}]
        GA["GET /api/v1/contacts/:id/addresses/:aid"] -->|"200"| GAR[{data: address}]
        UA["PUT /api/v1/contacts/:id/addresses/:aid"] -->|"200"| UAR[{data: updated address}]
        DA["DELETE /api/v1/contacts/:id/addresses/:aid"] -->|"200"| DAR[{data: OK}]
        LA["GET /api/v1/contacts/:id/addresses"] -->|"200"| LAR[{data: [...], paging: {...}}]
    end
```

---

## 7. Database Schema & Relationships

```mermaid
erDiagram
    User ||--o{ Contact : has
    Contact ||--o{ Address : has

    User {
        string username PK "VARCHAR(100)"
        string password "VARCHAR(100)"
        string name "VARCHAR(100)"
        string token "VARCHAR(100) UNIQUE, nullable"
    }

    Contact {
        int id PK "autoincrement"
        string first_name "VARCHAR(100)"
        string last_name "VARCHAR(100) nullable"
        string email "VARCHAR(100) nullable"
        string phone "VARCHAR(20) nullable"
        string username FK "VARCHAR(100) -> User"
    }

    Address {
        int id PK "autoincrement"
        string street "VARCHAR(255) nullable"
        string city "VARCHAR(100) nullable"
        string province "VARCHAR(100) nullable"
        string country "VARCHAR(100)"
        string postal_code "VARCHAR(10)"
        int contact_id FK "-> Contact"
    }
```

---

## 8. Middleware Pipeline (Detail)

```mermaid
flowchart LR
    subgraph "Request Pipeline"
        direction TB
        R1["1. express.json()<br/>limit: env.BODY_LIMIT"] -->
        R2["2. compression()<br/>gzip response body"] -->
        R3["3. cors()<br/>origin: env.CORS_ORIGIN"] -->
        R4["4. requestIdMiddleware<br/>assign x-request-id UUID"] -->
        R5["5. requestLoggerMiddleware<br/>log: method, path, status, latency"] -->
        R6["6. metricsMiddleware<br/>track: counter + histogram"] -->
        R7["7. Routing<br/>publicRouter / apiRouter"] -->
        R8["8. errorMiddleware<br/>catch all errors"]
    end

    subgraph "Middleware Log Output"
        direction TB
        L1["requestLoggerMiddleware<br/>logger.info({ event: request,<br/>request_id, method, path,<br/>status, latency_ms,<br/>content_length, user_agent })"]
        L2["errorMiddleware<br/>logger.error({ event: error,<br/>type, message, stack,<br/>request_id, method, path })"]
    end

    R5 -.-> L1
    R8 -.-> L2

    style R1 fill:#e3f2fd,color:#333
    style R2 fill:#e3f2fd,color:#333
    style R3 fill:#e3f2fd,color:#333
    style R4 fill:#e3f2fd,color:#333
    style R5 fill:#e3f2fd,color:#333
    style R6 fill:#e3f2fd,color:#333
    style R7 fill:#c8e6c9,color:#333
    style R8 fill:#ffcdd2,color:#333
```

**Middleware Behavior Notes:**

- **`metricsMiddleware`** memiliki guard khusus untuk path `/metrics`: jika request mengarah ke `/api/v1/metrics`, middleware akan langsung `next()` tanpa mencatat metrik. Ini mencegah rekursi — endpoint `/metrics` sendiri tidak dihitung sebagai request.

---

## 9. Docker Infrastructure

```mermaid
graph TB
    subgraph "Docker Network: monitoring"
        direction TB

        subgraph "Application"
            API[rest-api<br/>:3000 → host:3030]
            DB[MySQL 8.4<br/>:3306]
        end

        subgraph "Monitoring Stack"
            P[Prometheus<br/>:9090]
            G[Grafana<br/>:4000]
            L[Loki<br/>:3100]
            T[Tempo<br/>:3200]
            A[Alloy<br/>OTel Collector<br/>:12345, :4317, :4318]
        end

        subgraph "Load Testing (profile: k6)"
            K6L[k6 load-test]
            K6F[k6 functional-test]
            K6E[k6 error-test]
        end
    end

    subgraph "Persistent Volumes"
        V1[(mysql-data)]
        V2[(prometheus-data)]
        V3[(grafana-data)]
        V4[(loki-data)]
        V5[(tempo-data)]
    end

    subgraph "Host Bind Mount"
        V6[./logs<br/>→ /app/logs]
    end

    DB --- V1
    P --- V2
    G --- V3
    L --- V4
    T --- V5
    API --- V6

    API --> DB
    API -->|traces OTLP| A
    API -->|metrics scrape| P
    P -->|datasource| G
    L -->|datasource| G
    T -->|datasource| G
    A -->|logs| L
    A -->|traces| T
    K6L --> API
    K6F --> API
    K6E --> API

    style API fill:#4caf50,color:#fff
    style DB fill:#4479a1,color:#fff
    style P fill:#e85d4a,color:#fff
    style G fill:#f47b20,color:#fff
    style L fill:#f5a623,color:#fff
    style T fill:#4caf50,color:#fff
    style A fill:#f0c040,color:#333
```

---

## 10. Observability Data Flow

```mermaid
flowchart TB
    subgraph "METRICS — Prometheus Pull Model"
        direction LR
        M1[rest-api:3000<br/>/api/v1/metrics] -->|scrape 15s| P[Prometheus]
        M2[alloy:12345<br/>/metrics] -->|scrape 15s| P
        M3[tempo:3200<br/>/metrics] -->|scrape 15s| P
        TMG[tempo metrics<br/>generator] -->|remote write| P
        P -->|PromQL| G[Grafana]
    end

    subgraph "LOGS — Alloy Push Model"
        direction LR
        L1[Docker stdout + stderr] -->|loki.source.docker| A[Alloy]
        A -->|loki.write| L[Loki]
        L -->|LogQL| G
    end

    subgraph "TRACES — OTLP Push Model"
        direction LR
        T1[Express request<br/>OpenTelemetry SDK] -->|OTLP HTTP| T2[Alloy<br/>otelcol.receiver.otlp]
        T2 -->|OTLP gRPC| T3[Tempo]
        T3 -->|TraceQL| G
    end

    subgraph "Grafana Dashboard Panels"
        direction TB
        D1["Stat: Total RPS, p95, 5xx, Ratio"]
        D2["Timeseries: RPS/Latency by endpoint, Status, Memory, Event Loop"]
        D3["Logs: Real-time log viewer"]
    end

    G --- D1
    G --- D2
    G --- D3

    style P fill:#e85d4a,color:#fff
    style G fill:#f47b20,color:#fff
    style L fill:#f5a623,color:#fff
    style A fill:#f0c040,color:#333
```

---

## 11. Logging Architecture

```mermaid
flowchart TB
    subgraph "Log Sources"
        direction TB
        S1[Request Logger<br/>per HTTP request]
        S2[Error Handler<br/>per caught error]
        S3[Prisma Events<br/>query, error, warn, info]
        S4[Process Events<br/>unhandledRejection,<br/>uncaughtException]
        S5[Graceful Shutdown<br/>SIGTERM, SIGINT]
    end

    subgraph "Winston Logger"
        direction TB
        F[traceIdFormat<br/>inject trace_id from OTel]
        F --> J[JSON format]
        J --> C[Console transport<br/>stdout]
        J --> D[DailyRotateFile<br/>logs/app-YYYY-MM-DD.log<br/>maxFiles: 14d<br/>zippedArchive: true]
    end

    subgraph "Log Storage & Query"
        C -->|Docker collects stdout| A[Alloy<br/>loki.source.docker]
        D -->|host mount| LF[Log file on host<br/>developer access]
        A --> L1[Loki<br/>30d retention]
        LF -->|tail/less| VI[Developer terminal]
        L1 -->|LogQL| G[Grafana Dashboard<br/>Logs panel]
    end

    S1 --> F
    S2 --> F
    S3 --> F
    S4 --> F
    S5 --> F

    style F fill:#e3f2fd,color:#333
    style J fill:#e3f2fd,color:#333
    style C fill:#c8e6c9,color:#333
    style D fill:#c8e6c9,color:#333
    style A fill:#f0c040,color:#333
    style L1 fill:#f5a623,color:#fff
```

### Prisma Event Logging

PrismaClient dikonfigurasi dengan 4 level event logging yang semuanya menggunakan `emit: "event"` (tidak langsung ke stdout) dan di-forward ke Winston logger:

| Level | Winston Level | Payload |
|-------|--------------|---------|
| `error` | `logger.error()` | `{ event, message, target }` |
| `warn` | `logger.warn()` | `{ event, message, target }` |
| `info` | `logger.info()` | `{ event, message, target }` |
| `query` | `logger.debug()` | `{ event, query, duration }` |

Query log dicatat di level `debug` agar tidak mencemari log produksi, namun tetap tersedia untuk profiling query lambat.

Source: `src/app/database.ts`

---

## 12. Build Pipeline

```mermaid
flowchart LR
    subgraph "Builder Stage"
        B1[FROM node:20-alpine] --> B2[Install openssl]
        B2 --> B3[COPY package*.json]
        B3 --> B4[npm ci]
        B4 --> B5[COPY all source]
        B5 --> B6[npx prisma generate]
        B6 --> B7[npm run build<br/>tsc]
    end

    subgraph "Runner Stage"
        R1[FROM node:20-alpine] --> R2[Install openssl]
        R2 --> R3[COPY ./dist from builder]
        R3 --> R4[COPY ./node_modules from builder]
        R4 --> R5[COPY ./prisma from builder]
        R5 --> R6[COPY docker-entrypoint.sh]
        R6 --> R7[EXPOSE 3000]
        R7 --> R8[CMD: entrypoint.sh]
    end

    subgraph "Entrypoint"
        E1[npx prisma migrate deploy] --> E2[exec node dist/main.js]
    end

    B7 --> R1
    R8 --> E1
```

---

## 13. Source Code Structure

```mermaid
graph TB
    subgraph "src/ — Application Source"
        direction TB
        MAIN[main.ts<br/>entry point + graceful shutdown]
        APP[app/<br/>Express setup]
        CONFIG[config/<br/>env + constants]
        CTRL[controllers/<br/>route handlers]
        SRV[services/<br/>business logic]
        VAL[validations/<br/>Zod schemas]
        MOD[models/<br/>types + mappers]
        MID[middleware/<br/>Express middleware]
        ROUT[routes/<br/>public + protected]
        ERR[errors/<br/>ResponseError class]
        TYP[types/<br/>UserRequest interface]
    end

    subgraph "test/ — Test Suites (54 total)"
        T1[user.test.ts — 19 tests]
        T2[contact.test.ts — 14 tests]
        T3[address.test.ts — 15 tests]
        T4[monitoring.test.ts — 3 tests]
        T5[test-util.test.ts — 3 tests]
    end

    subgraph "config/ — Infrastructure"
        C1[prometheus.yml<br/>scrape targets]
        C2[loki-config.yml<br/>30d retention, compactor]
        C3[tempo.yml<br/>24h block retention]
        C4[alloy/config.alloy<br/>OTel + log collector]
        C5[docker-compose.yaml<br/>9 services]
    end

    MAIN --> APP
    APP --> MID
    APP --> ROUT
    APP --> ERR
    ROUT --> CTRL
    CTRL --> SRV
    SRV --> VAL
    SRV --> MOD
    SRV --> ERR
```

---

## 14. Port Mapping

| Service | Host Port | Container Port | Protocol | Purpose |
|---------|-----------|----------------|----------|---------|
| Express API | **3030** | 3000 | HTTP | API endpoints |
| MySQL | **3306** | 3306 | TCP | Database |
| Prometheus | **9090** | 9090 | HTTP | Metrics UI + API |
| Grafana | **4000** | 3000 | HTTP | Dashboard UI |
| Loki | **3100** | 3100 | HTTP | Log storage API |
| Tempo | **3200** | 3200 | HTTP | Tracing UI + API |
| Alloy | **12345** | 12345 | HTTP | Collector admin |
| Alloy | — | 4317 | gRPC | OTLP trace receiver |
| Alloy | — | 4318 | HTTP | OTLP trace receiver |

---

## 15. Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3030` | HTTP listen port |
| `DATABASE_URL` | `mysql://root:@localhost:3306/...` | MySQL connection |
| `LOG_LEVEL` | `debug` | Winston log level |
| `LOG_DIR` | `logs` | Log file directory |
| `LOG_MAX_FILES` | `14d` | Log retention period |
| `BODY_LIMIT` | `1mb` | Max request body size |
| `CORS_ORIGIN` | `*` | CORS allowed origins |
| `JWT_SECRET` | — | JWT signing secret |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318` | Trace export endpoint |
| `OTEL_SERVICE_NAME` | `typescript-restful-api` | Trace service name |
| `OTEL_SDK_DISABLED` | — | Set `true` to disable tracing |

---

## 16. Complete Endpoint Inventory

| Method | Path | Auth | Controller | Validation | Response |
|--------|------|------|-----------|------------|----------|
| `GET` | `/api/v1/healthz` | — | `Monitoring.liveness` | — | `200 "OK"` |
| `GET` | `/api/v1/health` | — | `Monitoring.health` | — | `200 {status}` / `503 {status, errors}` |
| `GET` | `/api/v1/metrics` | — | `Monitoring.metrics` | — | `200 Prometheus text` |
| `POST` | `/api/v1/users` | — | `User.register` | `REGISTER` | `201 {data}` / `400 {errors}` |
| `POST` | `/api/v1/users/login` | — | `User.login` | `LOGIN` | `200 {data: tokens}` / `401` |
| `POST` | `/api/v1/users/refresh` | — | `User.refresh` | `REFRESH` | `200 {data: tokens}` / `401` |
| `GET` | `/api/v1/users/current` | JWT/X-API | `User.get` | — | `200 {data}` / `401` |
| `PATCH` | `/api/v1/users/current` | JWT/X-API | `User.update` | `UPDATE` | `200 {data}` / `400` / `401` |
| `DELETE` | `/api/v1/users/current` | JWT/X-API | `User.logout` | — | `200 {data: "OK"}` / `401` |
| `POST` | `/api/v1/contacts` | JWT/X-API | `Contact.create` | `CREATE` | `201 {data}` / `400` / `401` |
| `GET` | `/api/v1/contacts/:id` | JWT/X-API | `Contact.get` | — | `200 {data}` / `404` / `401` |
| `PUT` | `/api/v1/contacts/:id` | JWT/X-API | `Contact.update` | `UPDATE` | `200 {data}` / `400` / `404` / `401` |
| `DELETE` | `/api/v1/contacts/:id` | JWT/X-API | `Contact.remove` | — | `200 {data: "OK"}` / `404` / `401` |
| `GET` | `/api/v1/contacts` | JWT/X-API | `Contact.search` | `SEARCH` | `200 {data[], paging}` / `401` |
| `POST` | `/api/v1/contacts/:id/addresses` | JWT/X-API | `Address.create` | `CREATE` | `201 {data}` / `400` / `404` / `401` |
| `GET` | `/api/v1/contacts/:id/addresses/:aid` | JWT/X-API | `Address.get` | `GET` | `200 {data}` / `404` / `401` |
| `PUT` | `/api/v1/contacts/:id/addresses/:aid` | JWT/X-API | `Address.update` | `UPDATE` | `200 {data}` / `400` / `404` / `401` |
| `DELETE` | `/api/v1/contacts/:id/addresses/:aid` | JWT/X-API | `Address.remove` | `REMOVE` | `200 {data: "OK"}` / `404` / `401` |
| `GET` | `/api/v1/contacts/:id/addresses` | JWT/X-API | `Address.list` | — | `200 {data[], paging}` / `404` / `401` |

> **Note:** Route params `:id` and `:aid` only accept numeric values (`(\d+)` regex constraint). Non-numeric values produce 404.

---

## 17. Error Response Matrix

| Status | Condition | Response Body |
|--------|-----------|---------------|
| `200` | Success | `{ data: ... }` |
| `201` | Created | `{ data: ... }` |
| `400` | Zod validation failed | `{ errors: [{ path, message }] }` |
| `400` | Business logic (duplicate user) | `{ errors: [{ message }] }` |
| `401` | Missing or invalid auth | `{ errors: [{ message: "Unauthorized" }] }` |
| `401` | Wrong credentials | `{ errors: [{ message: "Username or password is wrong" }] }` |
| `401` | Invalid refresh token | `{ errors: [{ message: "Invalid refresh token" }] }` |
| `404` | Resource not found | `{ errors: [{ message }] }` |
| `409` | Unique constraint violation | `{ errors: [{ message: "Resource already exists" }] }` |
| `500` | Unknown error (production) | `{ errors: [{ message: "Internal server error" }] }` |
| `500` | Unknown error (development) | `{ errors: [{ message: error.message }] }` |
| `503` | DB unreachable (health check) | `{ status: "unhealthy", errors: [{ message }] }` |

---

## 18. Grafana Dashboard Panel Reference

| # | Panel | Type | Source | Query |
|---|-------|------|--------|-------|
| 1 | Total RPS | Stat | Prometheus | `sum(rate(http_requests_total[1m]))` |
| 2 | Global p95 Latency | Stat | Prometheus | `histogram_quantile(0.95, ...)` |
| 3 | 5xx Error RPS | Stat | Prometheus | `sum(rate(http_requests_total{status=~"5.."}[1m]))` |
| 4 | 5xx Error Ratio | Stat | Prometheus | `5xx / total` with clamp_min |
| 5 | RPS by Endpoint | Timeseries | Prometheus | `sum by(route, method)(rate(...))` |
| 6 | p95 Latency by Endpoint | Timeseries | Prometheus | `histogram_quantile` per route |
| 7 | Average Latency (ms) | Timeseries | Prometheus | `rate(sum) / rate(count) * 1000` |
| 8 | RPS by Status | Timeseries | Prometheus | `sum by(status)(rate(...))` |
| 9 | 4xx/5xx RPS by Endpoint | Timeseries | Prometheus | `sum by(route, method, status)(...)` |
| 10 | Node.js Memory | Timeseries | Prometheus | `process_resident_memory_bytes{job=~"$job"}` |
| 11 | Event Loop Lag | Timeseries | Prometheus | `nodejs_eventloop_lag_mean_seconds` + `p99` |
| 12 | Logs | Logs | Loki | `{service="typescript-restful-api"} \| json` |

Dashboard URL: `http://localhost:4000/d/typescript-rest-api-monitoring/`  
Refresh: 5s | Time range: last 15 minutes  
Datasources: Prometheus (default), Loki, Tempo
