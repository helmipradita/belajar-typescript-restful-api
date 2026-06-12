# Error Handling

Semua error response menggunakan format **array of objects** yang konsisten di seluruh endpoint.

---

## Middleware Pipeline

```mermaid
graph LR
    A[Request] --> B[requestId]
    B --> C[requestLogger]
    C --> D[metrics]
    D --> E{Routes}
    E -->|Success| F[Response 2xx]
    E -->|Error| G[errorMiddleware]
    G --> H[Response with errors array]
```

---

## Error Decision Tree

```mermaid
flowchart TD
    E[Error thrown] --> T{instanceof?}
    
    T -->|ZodError| Z[Validation Error]
    T -->|ResponseError| R[Business Error]
    T -->|PrismaClientKnownRequestError| P[Database Error]
    T -->|Other| G[Generic Error]
    
    Z --> Z1["Status 400"]
    Z --> Z2["Format: [{path, message}]"]
    
    R --> R1["Status sesuai throw (400/401/404/etc)"]
    R --> R2["Format: [{message}]"]
    
    P --> P1{Prisma Error Code}
    P1 -->|P2002| P2a["Status 409 — Resource already exists"]
    P1 -->|P2025| P2b["Status 404 — Resource not found"]
    P1 -->|Other| P2c["Status 400 — Database request error"]
    
    G --> G1{Node env?}
    G1 -->|Production| G2a["Status 500 — Internal server error"]
    G1 -->|Development| G2b["Status 500 — error.message asli"]
```

---

## Format Dasar

```json
{
  "errors": [
    { "message": "Pesan error..." }
  ]
}
```

Untuk **validation error**, ditambahkan field `path` yang menunjuk field spesifik:

```json
{
  "errors": [
    { "path": "email", "message": "Invalid email" },
    { "path": "password", "message": "String must contain at least 1 character(s)" }
  ]
}
```

---

## Flow Per Skenario

### 1. Validation Error (Zod)

```mermaid
sequenceDiagram
    participant C as Client
    participant V as Zod Validation
    participant H as Error Middleware
    participant R as Response

    C->>V: POST /api/v1/users<br/>{ "username": "" }
    V->>V: schema.parse(data) fails
    V->>H: throw ZodError
    H->>H: Map issues → [{path, message}]
    H->>R: 400<br/>{"errors":[{path,message}]}
    R->>C: Response
```

**Request:**
```http
POST /api/v1/users
Content-Type: application/json

{
  "username": "",
  "password": "",
  "name": ""
}
```

**Response (400):**
```json
{
  "errors": [
    { "path": "username", "message": "String must contain at least 1 character(s)" },
    { "path": "password", "message": "Required" },
    { "path": "name", "message": "Required" }
  ]
}
```

---

### 2. Business Error (ResponseError)

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Service Layer
    participant H as Error Middleware
    participant R as Response

    C->>S: GET /api/v1/contacts/999
    S->>S: Contact not found
    S->>H: throw ResponseError(404, "Contact not found")
    H->>H: Wrap → [{message}]
    H->>R: 404<br/>{"errors":[{"message":"Contact not found"}]}
    R->>C: Response
```

**Request:**
```http
GET /api/v1/contacts/99999
Authorization: Bearer <jwt>
```

**Response (404):**
```json
{
  "errors": [
    { "message": "Contact not found" }
  ]
}
```

---

### 3. Unauthorized (Auth Middleware)

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth Middleware
    participant R as Response

    C->>A: GET /api/v1/users/current<br/>(no token)
    A->>A: Token not found
    A->>R: 401<br/>{"errors":[{"message":"Unauthorized"}]}
    R->>C: Response
```

**Request:**
```http
GET /api/v1/users/current
```

**Response (401):**
```json
{
  "errors": [
    { "message": "Unauthorized" }
  ]
}
```

---

### 4. Database Error (Prisma)

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Service Layer
    participant DB as MySQL (Prisma)
    participant H as Error Middleware
    participant R as Response

    C->>S: POST /api/v1/users (duplicate username)
    S->>DB: prisma.user.create()
    DB->>S: PrismaClientKnownRequestError P2002
    S->>H: throw error
    H->>H: Check code → P2002
    H->>R: 409<br/>{"errors":[{"message":"Resource already exists"}]}
    R->>C: Response
```

**Request:**
```http
POST /api/v1/users
Content-Type: application/json

{
  "username": "eko",
  "password": "eko123",
  "name": "Eko"
}
```

**Response (409):**
```json
{
  "errors": [
    { "message": "Resource already exists" }
  ]
}
```

---

### 5. Generic 500 (Development vs Production)

```mermaid
sequenceDiagram
    participant C as Client
    participant H as Error Middleware
    participant R as Response

    Note over H: Unexpected error occurs
    H->>H: Check NODE_ENV

    alt Production
        H->>R: 500<br/>{"errors":[{"message":"Internal server error"}]}
    else Development
        H->>R: 500<br/>{"errors":[{"message":"<error.message asli>"}]}
    end

    R->>C: Response
```

**Response — Production (500):**
```json
{
  "errors": [
    { "message": "Internal server error" }
  ]
}
```

**Response — Development (500):**
```json
{
  "errors": [
    { "message": "Cannot read property 'x' of undefined" }
  ]
}
```

---

## Daftar Error per Tipe

| Tipe | Status Code | Format | Field `path` | Contoh |
|------|-------------|--------|-------------|--------|
| **Validation (ZodError)** | `400` | `[{path, message}]` | ✅ Ada | `{"path":"email","message":"Invalid email"}` |
| **Business (ResponseError)** | Custom (400/401/404) | `[{message}]` | ❌ Tidak | `{"message":"Contact not found"}` |
| **DB Unique (Prisma P2002)** | `409` | `[{message}]` | ❌ Tidak | `{"message":"Resource already exists"}` |
| **DB Not Found (Prisma P2025)** | `404` | `[{message}]` | ❌ Tidak | `{"message":"Resource not found"}` |
| **DB Generic (Prisma other)** | `400` | `[{message}]` | ❌ Tidak | `{"message":"Database request error"}` |
| **Unauthorized (Auth)** | `401` | `[{message}]` | ❌ Tidak | `{"message":"Unauthorized"}` |
| **Internal Server Error** | `500` | `[{message}]` | ❌ Tidak | `{"message":"Internal server error"}` |
| **Health Check Dependency** | `503` | `[{message}]` | ❌ Tidak | `{"message":"dependency unavailable"}` |

---

## Sumber Error

| Sumber | File | Mekanisme |
|--------|------|-----------|
| **ZodError** | `src/validations/*.ts` | Validasi request body via `schema.parse(data)` |
| **ResponseError** | `src/errors/response-error.ts` | Business logic throw `new ResponseError(status, message)` |
| **PrismaClientKnownRequestError** | `src/middleware/error-middleware.ts` | Database operation errors (P2002, P2025) |
| **Auth Middleware** | `src/middleware/auth-middleware.ts` | JWT invalid / token tidak ditemukan |
| **Monitoring** | `src/controllers/monitoring-controller.ts` | Database unreachable saat health check |

## Catatan

- **Production**: Generic 500 error menyembunyikan detail pesan (`"Internal server error"`)
- **Development**: Generic 500 error menampilkan pesan asli (`error.message`)
- Frontend cukup melakukan `errors.map(e => e.message)` tanpa perlu mengecek tipe data
- Untuk validation error, frontend bisa pakai `errors.map(e => ({ field: e.path, msg: e.message }))` untuk mapping ke form field
