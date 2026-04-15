# Perbedaan src/application/web.ts

## Current Version (21 lines)

```typescript
import express from "express";
import {publicRouter} from "../route/public-api";
import {errorMiddleware} from "../middleware/error-middleware";
import {apiRouter} from "../route/api";
import {healthRouter} from "../route/health-route";

export const web = express();
web.use(express.json());

// Health check routes (no auth required) - must be first
web.use(healthRouter);

// Public API routes (no auth required)
web.use(publicRouter);

// Protected API routes (auth required)
web.use(apiRouter);

// Error handling middleware (must be last)
web.use(errorMiddleware);
```

---

## PZN Version (11 lines)

```typescript
import express from "express";
import {publicRouter} from "../route/public-api";
import {errorMiddleware} from "../middleware/error-middleware";
import {apiRouter} from "../route/api";

export const web = express();
web.use(express.json());
web.use(publicRouter);
web.use(apiRouter);
web.use(errorMiddleware);
```

---

## Perbedaan

| Line | Current | PZN |
|------|---------|-----|
| 5 | `import {healthRouter} from "../route/health-route";` | ❌ Tidak ada |
| 11-12 | `// Health check routes...`<br>`web.use(healthRouter);` | ❌ Tidak ada |
| 14-15 | `// Public API routes...` (comment) | ❌ Tidak ada |
| 17-18 | `// Protected API routes...` (comment) | ❌ Tidak ada |
| 20-21 | `// Error handling...` (comment) | ❌ Tidak ada |

---

## Analisis

### Perbedaan Fungsional

**Current menambahkan health check routes**:
- `GET /health` - Health check dengan status semua services
- `GET /liveness` - Liveness probe untuk Kubernetes
- `GET /readiness` - Readiness probe untuk Kubernetes

### Perbedaan Non-Fungsional

**Current memiliki komentar** untuk menjelaskan setiap section:
- Health check routes (no auth required) - must be first
- Public API routes (no auth required)
- Protected API routes (auth required)
- Error handling middleware (must be last)

---

## Impact

**Untuk Development**: Tidak ada impact, kedua version bekerja sama.

**Untuk Production**: Current lebih baik karena:
1. Health checks penting untuk Kubernetes/container orchestration
2. Komentar membantu developer memahami urutan middleware

---

## Kesimpulan

Perbedaan di web.ts sederhana:
- Current menambahkan health check functionality
- Current menambahkan komentar dokumentatif

Keduanya tidak mengubah core functionality, hanya menambah fitur monitoring.
