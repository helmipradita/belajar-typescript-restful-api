# Plan: Fix Documentation Discrepancies

## Latar Belakang

Berdasarkan pembacaan semua file source code dan dokumentasi, ditemukan beberapa ketidaksesuaian antara dokumentasi `.md` dan implementasi aktual. Berikut plan perbaikannya.

---

## Ringkasan Per File

| File | Issue | Severity | Action |
|------|-------|----------|--------|
| `docs/ARCHITECTURE.md` | Alloy file scraping disebut ada, padahal tidak | Medium | Hapus node file scrape dari diagram |
| `docs/ARCHITECTURE.md` | Metrics middleware guard `/metrics` tidak disebut | Low | Tambahkan dokumentasi |
| `docs/ARCHITECTURE.md` | Prisma event logging tidak disebut | Low | Tambahkan sub-section |
| `docs/BLUEPRINT.md` | Metrics middleware guard `/metrics` tidak disebut | Low | Tambahkan dokumentasi |
| `docs/BLUEPRINT.md` | Prisma event logging tidak disebut | Low | Tambahkan sub-section |
| `docs/architecture-blueprint.md` | Lokasi retention: `30h` (salah) | Medium | Ubah ke `30d` / `720h` |
| `docs/architecture-blueprint.md` | Duplicate dari BLUEPRINT.md | High | Hapus file ini (merge ke BLUEPRINT.md) |

---

## Step-by-Step

### Step 1: Fix `docs/ARCHITECTURE.md`

#### 1a. Update Section 10 (Observability Data Flow) — LOGS subgraph

**Sekarang:** Ada `loki.source.file` untuk scraping `logs/*.log`
**Seharusnya:** Hanya `loki.source.docker` untuk stdout (file scraping belum aktif)

Yang diubah di diagram `flowchart TB` section 10 — subgraph "LOGS — Alloy Push Model":
```
LOGS — Alloy Push Model:
- Hapus: L2[logs/*.log Winston file] -->|loki.source.file| A[Alloy]
- Ubah label jadi jelas: L1[Docker stdout + stderr] -->|loki.source.docker| A[Alloy]
```

#### 1b. Update Section 11 (Logging Architecture)

**Sekarang:** Alloy punya 2 jalur: `loki.source.docker` + `loki.source.file`
**Seharusnya:** Alloy cuma punya `loki.source.docker`

Yang diubah di diagram `flowchart TB` section 11:
- Hapus node `A2[Alloy\nloki.source.file]` dan koneksi `D --> A2` dan `A2 --> L1`
- File log (`logs/app-*.log`) tetap di host bind mount untuk akses developer via `tail/less` saja

#### 1c. Tambahkan dokumentasi metrics middleware guard

Di section 8 (Middleware Pipeline Detail), setelah deskripsi `metricsMiddleware`:
```md
**Catatan:** Middleware ini memiliki guard untuk path `/metrics`: jika request ke `/metrics`, 
middleware akan skip pencatatan metrik (mencegah rekursi karena endpoint `/metrics` sendiri 
dihitung sebagai request).
```

Source: `src/middleware/metrics-middleware.ts` line 13-16.

#### 1d. Tambahkan sub-section Prisma event logging

Di section 11, tambahkan setelah sub-section "Process Events":
```md
### Prisma Event Logging

PrismaClient dikonfigurasi dengan 4 level event logging (query, error, info, warn).
Semua event menggunakan `emit: "event"` (tidak langsung ke stdout) dan di-forward ke 
Winston logger:
- `error` → `logger.error({ event: "prisma:error", message, target })`
- `warn` → `logger.warn({ event: "prisma:warn", message, target })`
- `info` → `logger.info({ event: "prisma:info", message, target })`
- `query` → `logger.debug({ event: "prisma:query", query, duration })`

Query log dicatat di level `debug` agar tidak mencemari log produksi.
```

Source: `src/app/database.ts` line 7-42.

---

### Step 2: Fix `docs/BLUEPRINT.md`

#### 2a. Tambahkan metrics middleware guard

Di section 9 (Middleware Pipeline Detail), tambahkan catatan yang sama seperti di ARCHITECTURE.md.

#### 2b. Tambahkan Prisma event logging

Di section 5 (Database Schema) atau section baru, tambahkan dokumentasi event logging sama seperti di ARCHITECTURE.md.

---

### Step 3: Fix `docs/architecture-blueprint.md`

#### 3a. Fix Loki retention

Line 25: `30h retention` → `30d retention (720h)`

#### 3b. Merge atau hapus file

Karena `architecture-blueprint.md` adalah **duplicate** dari `BLUEPRINT.md` dengan konten yang sama tapi gaya notasi berbeda (emoji, struktur berbeda):

**Opsi Rekomendasi: HAPUS** `architecture-blueprint.md`

Alasan:
- `BLUEPRINT.md` sudah komprehensif (410 line) dengan 10 section lengkap
- `ARCHITECTURE.md` (720 line) sudah mencakup semua aspek dengan sangat detail (18 section)
- `architecture-blueprint.md` (397 line) adalah subset dari keduanya — tidak menambah nilai
- 3 file arsitektur membingungkan: mana yang source of truth?
- Nama file mirip (`BLUEPRINT.md` vs `architecture-blueprint.md`) memicu kebingungan

**Alternatif:** Jika ingin tetap ada, bedakan scope:
- `ARCHITECTURE.md` — detail teknis implementasi (diagram, kode references)
- `BLUEPRINT.md` — overview arsitektur, alur data, keputusan desain (high-level)
- `architecture-blueprint.md` → **hapus**, konten yang berguna dimasukkan ke `BLUEPRINT.md`

---

## Risk Assessment

| Perubahan | Risk | Alasan |
|-----------|------|--------|
| Update diagram ARCHITECTURE.md | Low | Hanya visual, tidak mengubah logika |
| Tambah catatan middleware guard | Low | Dokumentasi baru |
| Tambah Prisma event logging | Low | Dokumentasi baru |
| Fix Loki retention | Low | Perbaikan angka |
| Hapus architecture-blueprint.md | Medium | File reference dari file lain; cek dulu apakah ada link ke file ini |

---

## Checklist

- [ ] Update section 10 ARCHITECTURE.md (hapus `loki.source.file`)
- [ ] Update section 11 ARCHITECTURE.md (hapus `loki.source.file` dari diagram, tambah Prisma event logging)
- [ ] Update section 8 ARCHITECTURE.md (tambah metrics skip guard)
- [ ] Update section 9 BLUEPRINT.md (tambah metrics skip guard)
- [ ] Update section 5 BLUEPRINT.md (tambah Prisma event logging)
- [ ] Fix line 25 architecture-blueprint.md (30h → 30d)
- [ ] Hapus architecture-blueprint.md atau beri deprecation notice
- [ ] Cek cross-reference dari file .md lain → architecture-blueprint.md
