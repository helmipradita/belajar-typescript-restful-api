# K6 Functional Test

## Penjelasan

Functional test ini menguji **semua 23 endpoint** API secara komprehensif, mencakup baik response sukses (2xx) maupun error (4xx). Setiap iterasi menjalankan lifecycle lengkap satu user dari register sampai logout, termasuk pengujian edge case di tengah-tengah.

**Karakteristik:**
- **Jenis:** Functional / Correctness Test
- **VUs:** 200 Virtual Users
- **Iterasi:** 5000 iterasi (shared di antara 200 VUs, ~25 iterasi per VU)
- **Threshold:** p95 < 1000ms, checks rate > 0.95
- **Alur:** Full lifecycle + error scenarios di setiap iterasi

## Diagram VUs & Iterations

```mermaid
xychart-beta
    title "Virtual Users - Functional Test"
    x-axis "Waktu" [0, 1, 2, ..., 10]
    y-axis "VUs" 0 --> 220
    line [200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 0]
```

> 200 VU konstan, total 5000 iterasi dibagi rata (~25 per VU). Tidak ada ramp-up/ramp-down.

## Diagram API Flow per Iteration

```mermaid
sequenceDiagram
    participant VU as Virtual User (x20)
    participant API as REST API

    Note over VU,API: Monitoring Check

    VU->>API: GET /api/v1/healthz
    API-->>VU: 200 "OK"
    VU->>API: GET /api/v1/health
    API-->>VU: 200 {"status":"healthy"}

    Note over VU,API: User Registration & Auth

    VU->>API: POST /api/v1/users (Register)
    API-->>VU: 201 Created
    VU->>API: POST /api/v1/users (Duplikat)
    API-->>VU: 400 Bad Request
    VU->>API: POST /api/v1/users/login (Password Salah)
    API-->>VU: 401 Unauthorized
    VU->>API: GET /api/v1/users/current (Tanpa Token)
    API-->>VU: 401 Unauthorized
    VU->>API: GET /api/v1/users/current (Token Invalid)
    API-->>VU: 401 Unauthorized
    VU->>API: POST /api/v1/users/login (Login Valid)
    API-->>VU: 200 OK + Token

    Note over VU,API: Authenticated User

    VU->>API: GET /api/v1/users/current
    API-->>VU: 200 OK
    VU->>API: PATCH /api/v1/users/current
    API-->>VU: 200 OK

    Note over VU,API: Contact CRUD + Error

    VU->>API: GET /api/v1/contacts/999999999 (Not Found)
    API-->>VU: 404 Not Found
    VU->>API: POST /api/v1/contacts (Create)
    API-->>VU: 201 Created + ID
    VU->>API: GET /api/v1/contacts/:id
    API-->>VU: 200 OK
    VU->>API: PUT /api/v1/contacts/:id (Update)
    API-->>VU: 200 OK
    VU->>API: GET /api/v1/contacts?name=... (Search)
    API-->>VU: 200 OK + Paging

    Note over VU,API: Address CRUD + Error

    VU->>API: GET /api/v1/contacts/:id/addresses/999999999 (Not Found)
    API-->>VU: 404 Not Found
    VU->>API: POST /api/v1/contacts/:id/addresses (Create)
    API-->>VU: 201 Created + ID
    VU->>API: GET /api/v1/contacts/:id/addresses/:aid
    API-->>VU: 200 OK
    VU->>API: PUT /api/v1/contacts/:id/addresses/:aid (Update)
    API-->>VU: 200 OK
    VU->>API: GET /api/v1/contacts/:id/addresses (List)
    API-->>VU: 200 OK + Array
    VU->>API: DELETE /api/v1/contacts/:id/addresses/:aid
    API-->>VU: 200 OK

    Note over VU,API: Cleanup

    VU->>API: DELETE /api/v1/contacts/:id
    API-->>VU: 200 OK
    VU->>API: DELETE /api/v1/users/current (Logout)
    API-->>VU: 200 OK
```

## Diagram Iteration Flow

```mermaid
flowchart TD
    A[Mulai Iterasi] --> HZ[GET /api/v1/healthz]
    HZ --> H[GET /api/v1/health]
    H --> B[POST /api/v1/users Register]
    B --> BD[POST /api/v1/users Duplikat 400]
    BD --> WL[POST /api/v1/users/login Wrong 401]
    WL --> MT[GET /api/v1/users/current No Token 401]
    MT --> IT[GET /api/v1/users/current Invalid Token 401]
    IT --> C[POST /api/v1/users/login Login Valid]
    C --> D{Token OK?}
    D -->|Tidak| END[Selesai]
    D -->|Ya| E[GET /api/v1/users/current]
    E --> F[PATCH /api/v1/users/current]
    F --> G[GET /api/v1/contacts/999999999 404]
    G --> J[POST /api/v1/contacts Create]
    J --> K{Contact OK?}
    K -->|Tidak| W[DELETE /api/v1/users/current Logout]
    K -->|Ya| L[GET /api/v1/contacts/:id]
    L --> M[PUT /api/v1/contacts/:id Update]
    M --> N[GET /api/v1/contacts?name= Search]
    N --> O[GET /api/v1/contacts/:id/addresses/999999999 404]
    O --> P[POST /api/v1/contacts/:id/addresses Create]
    P --> Q{Address OK?}
    Q -->|Tidak| T[DELETE /api/v1/contacts/:id]
    Q -->|Ya| R[GET Address]
    R --> R1[PUT Address Update]
    R1 --> R2[GET Addresses List]
    R2 --> R3[DELETE Address]
    R3 --> T
    T --> W
    W --> S[Iterasi Berikutnya]
```

## Endpoint Coverage

| # | Endpoint | Method | Skenario | Expected |
|---|----------|--------|----------|----------|
| 1 | `/api/v1/healthz` | GET | Health check simple | 200 |
| 2 | `/api/v1/health` | GET | Health check detail | 200 |
| 3 | `/api/v1/users` | POST | Register valid | 201 |
| 4 | `/api/v1/users` | POST | Register duplikat | 400 |
| 5 | `/api/v1/users/login` | POST | Password salah | 401 |
| 6 | `/api/v1/users/current` | GET | Tanpa token | 401 |
| 7 | `/api/v1/users/current` | GET | Token invalid | 401 |
| 8 | `/api/v1/users/login` | POST | Login valid | 200 |
| 9 | `/api/v1/users/current` | GET | Get profile (auth) | 200 |
| 10 | `/api/v1/users/current` | PATCH | Update profile | 200 |
| 11 | `/api/v1/contacts/:id` | GET | Contact not found | 404 |
| 12 | `/api/v1/contacts` | POST | Create contact | 201 |
| 13 | `/api/v1/contacts/:id` | GET | Get contact | 200 |
| 14 | `/api/v1/contacts/:id` | PUT | Update contact | 200 |
| 15 | `/api/v1/contacts` | GET | Search contacts | 200 |
| 16 | `/api/v1/contacts/:id/addresses/:aid` | GET | Address not found | 404 |
| 17 | `/api/v1/contacts/:id/addresses` | POST | Create address | 201 |
| 18 | `/api/v1/contacts/:id/addresses/:aid` | GET | Get address | 200 |
| 19 | `/api/v1/contacts/:id/addresses/:aid` | PUT | Update address | 200 |
| 20 | `/api/v1/contacts/:id/addresses` | GET | List addresses | 200 |
| 21 | `/api/v1/contacts/:id/addresses/:aid` | DELETE | Delete address | 200 |
| 22 | `/api/v1/contacts/:id` | DELETE | Delete contact | 200 |
| 23 | `/api/v1/users/current` | DELETE | Logout | 200 |

## Thresholds

| Metric | Threshold | Keterangan |
|--------|-----------|------------|
| `http_req_duration` | p(95) < 1000ms | Response time wajar untuk functional test |
| `checks` | rate > 0.95 | 95% assertion harus pass |

## Cara Menjalankan

```bash
docker compose --profile k6 run --rm k6-functional-test
```

## Contoh Output

```
     ✓ healthz status is 200
     ✓ healthz body is OK
     ✓ health status is 200
     ✓ health response is healthy
     ✓ register status is 201
     ✓ register returns username
     ✓ duplicate user status is 400
     ✓ wrong login status is 401
     ✓ missing token status is 401
     ✓ invalid token status is 401
     ...

     checks.........................: 97.82% ✓ 11000
     http_req_duration..............: avg=85.3ms  p(95)=420.1ms
     http_req_failed................: 0.00%
      iterations.....................: 5000
      vus............................: 200
```

---

## Error Scenarios Coverage (Subset)

Seluruh 8 skenario error juga diuji secara terpisah oleh **k6 error test** (1 VU, 1 iterasi). Detail error scenarios yang tercakup:

| Endpoint | Method | Skenario | Expected Status |
|----------|--------|----------|-----------------|
| `/api/v1/users` | POST | Register duplikat | 400 |
| `/api/v1/users/login` | POST | Password salah | 401 |
| `/api/v1/users/current` | GET | Tanpa token | 401 |
| `/api/v1/users/current` | GET | Token invalid | 401 |
| `/api/v1/contacts` | POST | Body invalid (email salah, field kosong) | 400 |
| `/api/v1/contacts/:id` | GET | ID tidak ada (999999999) | 404 |
| `/api/v1/contacts/:id/addresses` | POST | Body invalid (country kosong) | 400 |
| `/api/v1/contacts/:id/addresses/:aid` | GET | ID tidak ada (999999999) | 404 |

> Error test dapat dijalankan secara terpisah dengan: `docker compose --profile k6 run --rm k6-error-test`
> Perbedaannya: functional test menjalankan error + success dalam 1 iterasi user-siklus penuh (200 VU),
> sedangkan error test fokus murni pada skenario error (1 VU) tanpa beban. Keduanya komplementer.
