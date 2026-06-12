# K6 Load Test

## Penjelasan

Load test ini mensimulasikan beban normal pengguna secara bertahap untuk mengukur performa API dalam kondisi steady-state. Tujuannya adalah memastikan response time tetap di bawah threshold dan error rate terjaga.

**Karakteristik:**
- **Jenis:** Performance / Load Test
- **VUs:** Maksimal 20 Virtual Users
- **Durasi:** ~5 menit (1m ramp-up, 3m sustain, 1m ramp-down)
- **Threshold:** p95 < 500ms, error rate < 5%
- **Alur:** Happy path saja (register → login → CRUD contact → CRUD address → logout)

## Diagram VUs Over Time

```mermaid
xychart-beta
    title "Virtual Users Over Time - Load Test"
    x-axis "Waktu (menit)" [0, 1, 2, 3, 4, 5]
    y-axis "Virtual Users" 0 --> 25
    line [0, 20, 20, 20, 20, 0]
```

## Diagram API Flow per Iteration

```mermaid
sequenceDiagram
    participant VU as Virtual User
    participant API as REST API

    Note over VU,API: 1 Iterasi = 1 User Lifecycle

    VU->>API: POST /api/v1/users (Register)
    API-->>VU: 201 Created + User Data

    VU->>API: POST /api/v1/users/login (Login)
    API-->>VU: 200 OK + Token

    VU->>API: GET /api/v1/users/current (Get Profile)
    API-->>VU: 200 OK + Profile

    VU->>API: PATCH /api/v1/users/current (Update Profile)
    API-->>VU: 200 OK + Updated

    VU->>API: POST /api/v1/contacts (Create Contact)
    API-->>VU: 201 Created + Contact ID

    VU->>API: GET /api/v1/contacts/:id (Get Contact)
    API-->>VU: 200 OK + Contact

    VU->>API: PUT /api/v1/contacts/:id (Update Contact)
    API-->>VU: 200 OK + Updated

    VU->>API: GET /api/v1/contacts?name=... (Search)
    API-->>VU: 200 OK + Results

    VU->>API: POST /api/v1/contacts/:id/addresses (Create Address)
    API-->>VU: 201 Created + Address ID

    VU->>API: GET /api/v1/contacts/:id/addresses/:aid (Get Address)
    API-->>VU: 200 OK + Address

    VU->>API: PUT /api/v1/contacts/:id/addresses/:aid (Update Address)
    API-->>VU: 200 OK + Updated

    VU->>API: GET /api/v1/contacts/:id/addresses (List Addresses)
    API-->>VU: 200 OK + Array

    VU->>API: DELETE /api/v1/contacts/:id/addresses/:aid (Delete Address)
    API-->>VU: 200 OK

    VU->>API: DELETE /api/v1/contacts/:id (Delete Contact)
    API-->>VU: 200 OK

    VU->>API: DELETE /api/v1/users/current (Logout)
    API-->>VU: 200 OK

    Note over VU: sleep(1) lalu iterasi berikutnya
```

## Diagram Iteration Flow

```mermaid
flowchart TD
    A[Mulai Iterasi] --> B[Register User]
    B --> C{Register OK?}
    C -->|Ya| D[Login User]
    C -->|Tidak| Z[Sleep 1s, Skip]

    D --> E{Login OK?}
    E -->|Tidak| Z
    E -->|Ya| F[Get Current User]
    F --> G[Update Current User]
    G --> H[Create Contact]

    H --> I{Contact OK?}
    I -->|Tidak| W[Logout]
    I -->|Ya| J[Get Contact]
    J --> K[Update Contact]
    K --> L[Search Contacts]
    L --> M[Create Address]

    M --> N{Address OK?}
    N -->|Tidak| Q[Delete Contact]
    N -->|Ya| O[Get Address]
    O --> P[Update Address]
    P --> P1[List Addresses]
    P1 --> P2[Delete Address]
    P2 --> Q

    Q --> W
    W --> R[Sleep 1s]
    R --> S[Iterasi Berikutnya]
```

## Thresholds

| Metric | Threshold | Keterangan |
|--------|-----------|------------|
| `http_req_duration` | p(95) < 500ms | 95% request harus di bawah 500ms |
| `http_req_failed` | rate < 0.05 | Error rate harus di bawah 5% |

## Cara Menjalankan

```bash
docker compose --profile k6 run --rm k6-load-test
```

## Contoh Output

```
     ✓ register status is 201
     ✓ register returns username
     ✓ login status is 200
     ✓ login has token
     ✓ current user status is 200
     ✓ current user is correct
     ...

     checks.........................: 98.45% ✓ 12345
     http_req_duration..............: avg=45.2ms  p(95)=180.3ms
     http_req_failed................: 0.02%  ✓ 5  ✗ 25000
     iterations.....................: 2500
     vus............................: 20
```
