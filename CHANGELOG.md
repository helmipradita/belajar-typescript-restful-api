# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## Unreleased

### Added

- File logging with daily rotation and retention (`winston-daily-rotate-file`) (`5b653cf`)
- CORS support (`5b653cf`)
- Configurable request body limit via `BODY_LIMIT` env (`5b653cf`)
- Response compression (`5b653cf`)
- Husky + lint-staged for pre-commit hooks (`5b653cf`)
- Comprehensive ARCHITECTURE.md with 18 sections covering all system aspects (`62d05df`)
- Docker resource limits (CPU/memory) for all services (`881c169`)
- Healthchecks for Prometheus, Grafana, Loki, Tempo (`881c169`)
- Prometheus remote-write receiver for Tempo metrics generator (`881c169`)
- Prometheus scrape targets for Alloy and Tempo (`881c169`)
- Loki compactor with 30d retention (up from 30h) (`881c169`)
- Loki ingester chunk tuning for better performance (`881c169`)
- Alloy log processing stage with enriched labels (`881c169`)
- Host volume mount for app logs (`881c169`)
- Developer workflow guide, Prisma migration guide, and test execution guide in README (`62d05df`)
- fix-docs-discrepancies plan (`0280ce0`)

### Changed

- Logging: console-only to console + file with max 14d retention (`5b653cf`)
- Upgraded Tempo image from `main-814c1c6` to `2.7.1` (`881c169`)
- Extended Tempo block retention from 1h to 24h (`881c169`)
- Fixed Tempo storage paths from `/var/tempo` to `/tmp/tempo` (container compat) (`881c169`)
- Grafana anonymous role from Admin to Viewer (`881c169`)
- Added rest-api container user directive for file permissions (`881c169`)

### Removed

- `docs/apis/monitoring.md` — merged into `docs/monitoring-stack.md` (`62d05df`)
- `docs/k6/error-test.md` — merged into `docs/k6/functional-test.md` (`62d05df`)

---

## [2.0.0] - 2026-06-12

### Added

- OpenTelemetry distributed tracing with OTLP export to Alloy/Tempo
- Trace ID correlation — every Winston log entry gets `trace_id` from active span
- JWT service with access + refresh token rotation
- `POST /api/v1/users/refresh` endpoint for token refresh
- Unique constraint on user `token` column
- Graceful shutdown on `SIGTERM` / `SIGINT` (close HTTP server, disconnect Prisma, stop tracing)
- Standardized error response format — all errors returned as `[{message}]` / `[{path, message}]` array
- Docker multi-stage build (builder + runner) with auto Prisma migration on startup
- Docker health check script — verifies all containers and HTTP endpoints
- Full monitoring stack via docker-compose: Prometheus, Grafana, Loki, Tempo, Alloy
- k6 load, functional, and error test profiles
- Centralized environment config with Zod validation (exit on missing vars)
- Centralized HTTP status codes and message constants
- Comprehensive API documentation (all endpoints, error formats, pagination)
- PZN divergence documentation — tracks all changes from the base project

### Changed

- Migrated all `process.env.*` to centralized `env.*` from `src/config/env.ts`
- Replaced all hardcoded HTTP status codes and error messages with constants
- Restructured folders: `src/application/` → `src/app/`, singular → plural naming
- Enhanced request logging with `event`, `latency_ms`, `content_length`, `user_agent`
- Filtered sensitive parameters from Prisma query logs
- Restructured test files into `test/api/` directory
- Updated all API routes to `/api/v1/` prefix consistently
- Updated README, manual-test.http, and all API spec docs

---

## [1.0.0] - 2024-02-26

### Added

- Initial release by ProgrammerZamanNow
- User CRUD: register, login, logout, update, get current user
- Contact CRUD: create, get by ID, update, remove, search with pagination
- Address CRUD: create, get, update, delete, list by contact
- JWT authentication with Bearer token and X-API-TOKEN header
- Winston structured JSON logging
- Prisma ORM with MySQL database
- Zod request validation
- Express server setup with middleware pipeline
- API specification documentation (user, contact, address)
- Manual test file for API endpoints
