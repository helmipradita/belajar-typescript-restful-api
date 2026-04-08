# Plan 001: Vibe Engineer Enhancement

## Status: COMPLETED ✓

## Context

Project `belajar-typescript-restful-api` sudah memiliki foundation yang sangat baik dengan dokumentasi komprehensif (`PROJECT_CONTEXT.md`, `init/` folder guides), arsitektur layered yang jelas, dan testing setup yang solid.

Namun, untuk meningkatkan "vibe engineer" (developer experience), ada beberapa enhancement yang perlu ditambahkan agar development workflow lebih efisien dan menyenangkan.

## Current State Analysis

### ✅ Already Excellent

- **Dokumentasi**: README.md, DOCS.md, PROJECT_CONTEXT.md, init/ folder dengan 8 guides
- **Testing**: Jest dengan Supertest, 70% coverage threshold
- **Code Quality**: ESLint, Prettier, Husky, lint-staged
- **CI/CD**: GitHub Actions dengan lint, format, test, build
- **Database**: Prisma ORM dengan migration support
- **Docker**: Multi-stage Dockerfile dengan health checks

### ❌ Missing for Better Developer Experience

1. **Hot Reload** - Belum ada nodemon/ts-node untuk auto-restart
2. **Debug Configuration** - Tidak ada VS Code launch.json, sourceMap disabled
3. **API Documentation** - Tidak ada Swagger/OpenAPI integration
4. **Development Utilities** - Tidak ada script untuk db:studio, db:seed, dll.
5. **Onboarding Docs** - Tidak ada panduan onboarding untuk developer baru
6. **Architecture Diagrams** - Tidak ada visualisasi arsitektur
7. **Troubleshooting Guide** - Tidak ada dokumentasi masalah umum
8. **Rate Limiting** - Belum ada proteksi rate limiting

## Implementation Plan

### Phase 1: Documentation Updates with Context7 MCP

**Library IDs:**
- Express: `/expressjs/express`
- Prisma: `/prisma/prisma`
- Zod: `/colinhacks/zod`
- Jest: `/jestjs/jest`
- Winston: `/winstonjs/winston`

**Actions:**
- [ ] Update `doc/context7/` dengan dokumentasi terbaru
- [ ] Tambah quick reference guides untuk setiap library

### Phase 2: Development Workflow

**2.1 Hot Reload**

Tambah ke `package.json`:
```json
"dev": "nodemon --exec ts-node src/main.ts",
"dev:debug": "nodemon --exec ts-node --inspect src/main.ts"
```

Install:
- `nodemon`
- `ts-node`

**2.2 Debug Configuration**

Buat `.vscode/launch.json` dan update `tsconfig.json`:
- Enable `sourceMap: true`
- Enable `declaration: true`

**2.3 Development Scripts**

Tambah script utilities:
```json
"db:studio": "prisma studio",
"db:seed": "tsx prisma/seed.ts",
"db:migrate:dev": "prisma migrate dev",
"db:push": "prisma db push",
"db:reset": "prisma migrate reset",
"clean": "rm -rf dist coverage"
```

### Phase 3: API Documentation

**Dependencies:**
- `swagger-jsdoc`
- `swagger-ui-express`
- `@types/swagger-jsdoc`
- `@types/swagger-ui-express`

**Implementation:**
- [ ] Buat `src/config/swagger.ts`
- [ ] Tambah JSDoc comments di semua controllers
- [ ] Buat endpoint `/api-docs`
- [ ] Update API_SPECIFICATION.md

### Phase 4: Enhanced Documentation

Buat folder `docs/` dengan file-file berikut:

- [ ] `ONBOARDING.md` - Panduan untuk developer baru
- [ ] `ARCHITECTURE.md` - Diagram arsitektur dengan Mermaid
- [ ] `TROUBLESHOOTING.md` - Masalah umum dan solusinya
- [ ] `TASKS.md` - Panduan task-task umum
- [ ] `SECURITY.md` - Best practices security
- [ ] `EXAMPLES.md` - Contoh kode lengkap

### Phase 5: Security Enhancements

**Dependencies:**
- `express-rate-limit`

**Implementation:**
- [ ] Rate limiting middleware
- [ ] Request size limit (10kb)
- [ ] Security audit logging

### Phase 6: Quality of Life

- [ ] `.editorconfig` untuk consistency editor settings
- [ ] Update `.gitignore` dengan `.vscode/`, `*.log`, dll.
- [ ] NPM scripts documentation

## Package Upgrade Plan (April 2026)

| Package | Current | Target | Priority |
|---------|---------|--------|----------|
| express | ^5.2.1 | ^5.3.0 | Medium |
| @prisma/client | ^6.0.0 | ^6.1.0 | Low |
| prisma | ^6.0.0 | ^6.1.0 | Low |
| zod | ^4.3.6 | ^4.5.0 | Low |
| jest | ^30.3.0 | ^31.0.0 | High (check breaking changes) |
| winston | ^3.19.0 | ^3.20.0 | Low |
| typescript | ^6.0.2 | ^6.2.0 | Medium |

**Upgrade Process:**
1. Buat backup branch
2. Update satu package per-saat
3. Run tests setelah upgrade
4. Update dokumentasi untuk breaking changes

## Files to Create

```
belajar-typescript-restful-api/
├── plans/
│   ├── README.md
│   ├── 001-vibe-engineer-enhancement.md
│   └── archive/
├── docs/
│   ├── ONBOARDING.md
│   ├── ARCHITECTURE.md
│   ├── TROUBLESHOOTING.md
│   ├── TASKS.md
│   ├── SECURITY.md
│   └── EXAMPLES.md
├── .vscode/
│   ├── launch.json
│   └── settings.json
├── .editorconfig
└── src/config/
    └── swagger.ts
```

## Files to Modify

- `package.json` - Add new scripts and dependencies
- `tsconfig.json` - Enable sourceMap and declaration
- `.gitignore` - Add ignore patterns
- `src/controller/*.ts` - Add JSDoc comments for Swagger
- `src/application/web.ts` - Add rate limiting

## Verification

Setelah implementasi selesai:

1. **Development Workflow:**
   ```bash
   npm run dev      # Hot reload works
   npm run dev:debug # Debug mode works
   npm run db:studio # Prisma Studio opens
   ```

2. **Documentation:**
   - Buka `/api-docs` untuk Swagger UI
   - Baca `docs/ONBOARDING.md` untuk onboarding

3. **Testing:**
   ```bash
   npm test          # All tests pass
   npm run test:coverage # Coverage >= 70%
   ```

4. **Security:**
   - Rate limiting aktif
   - Request size limit aktif

## Notes

- Plan ini akan dikerjakan bertahap
- Setiap phase selesai akan di-update statusnya
- Package upgrade akan dilakukan terakhir setelah enhancement selesai
- Documentation akan selalu di-sync dengan codebase

## References

- `PROJECT_CONTEXT.md` - Existing patterns and conventions
- `init/` folder - Existing documentation
- Context7 MCP - Latest library documentation
