# Feature-Based Architecture

Rencana migrasi dari Layered Architecture → Feature-Based (Colocation) untuk skala project >10 fitur.

---

## Current: Layered Architecture

```
src/
├── controllers/       # All controllers
├── services/          # All services
├── models/            # All models/DTOs
├── routes/            # All routes
├── validations/       # All validations
└── lib/               # Infrastructure
```

**Masalah saat scale:**
- Nambah 1 fitur = edit 5 folder berbeda
- Keterkaitan antar file fitur tersebar
- Delete fitur = hapus dari 5 folder

---

## Target: Feature-Based

```
src/
├── common/                        # Shared: lib/, middleware/, errors/
│   ├── lib/
│   ├── middleware/
│   └── errors/
├── features/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.route.ts
│   │   ├── auth.validation.ts
│   │   └── auth.model.ts
│   ├── contact/
│   │   ├── contact.controller.ts
│   │   ├── contact.service.ts
│   │   ├── contact.route.ts
│   │   ├── contact.validation.ts
│   │   └── contact.model.ts
│   └── address/
│       ├── address.controller.ts
│       ├── address.service.ts
│       ├── address.route.ts
│       ├── address.validation.ts
│       └── address.model.ts
├── app.ts
└── main.ts
```

---

## Kapan Migrasi

| Threshold | Action |
|-----------|--------|
| <10 fitur | Tetap layered (current) |
| 10-15 fitur | Mulai migrasi bertahap |
| >15 fitur | Full feature-based |

---

## Migrasi Plan

1. Buat `src/features/` folder
2. Pindah auth: `user.controller.ts`, `user.service.ts`, `user.route.ts`, `user.validation.ts`, `user.model.ts`
3. Update import paths
4. Uji coba — pastikan semua test pass
5. Ulangi untuk contact, address
6. Sisakan `src/common/` untuk shared: lib, middleware, errors

---

## Catatan

- Monitoring endpoint (healthz, health, metrics) tetap terpisah di `src/features/monitoring/`
- `src/common/lib/` = infrastructure (database, logging, tracing, metrics)
- `src/common/middleware/` = auth, error, request-id, logger, metrics
- `src/common/errors/` = ResponseError
