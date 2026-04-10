# Changelog

All notable changes from `main` branch to `chore/upgrade-deps-2026` branch.

## [Unreleased] - 2026-04-10

### Added
- **Infrastructure**: Redis integration with docker-compose
  - `docker-compose.yml` with Redis and Redis Insight containers
  - `src/application/redis.ts` - Redis client with connection management
  - Health check and graceful shutdown support
- **Documentation**: Offline reference guides for core packages (Express, Jest, Prisma, TypeScript, Winston, Zod)
- **Documentation**: Project planning docs (2026 enhancement and upgrade plans)
- **Documentation**: Security review and JWT migration guides
  - `plans/003-production-security-review.md`
  - `plans/004-security-packages-guide.md`
  - `plans/005-redis-jwt-auth-migration-guide.md`
- **Documentation**: `CLAUDE.md` - AI assistant context file with project guidelines
- **Documentation**: `INIT.md` - Project initialization documentation
- **Documentation**: `docs/` directory with comprehensive package references
- **Test Setup**: `test/jest.setup.ts` - Database cleanup before each test suite
- **Test**: Redis integration tests (`test/redis.test.ts`)

### Changed
- **Dependencies**: Upgraded all project dependencies to latest versions (2026-04-10)
  - Added: `redis@5.11.0` and `@types/redis@4.0.10`
  - Express: Major version upgrade
  - Prisma: Version bump
  - Jest: Latest version
  - TypeScript: Updated to v6
  - Zod: Updated to v4
  - Other dependencies: See package.json for details
- **TypeScript Config**: Updated `tsconfig.json` for stricter type checking
- **Babel Config**: Updated `babel.config.json` for compatibility
- **Main**: Added graceful shutdown handlers for Redis and database
- **Jest Setup**: Added Redis cleanup in test teardown
- **Test Utilities**: Enhanced `test/test-util.ts` with better helper functions

### Tests
- **User Controller**: Added error handling tests for get and logout (`7c2b158`)
  - Tests controller catch blocks when UserService throws errors
  - Achieves 100% coverage for user-controller.ts
- **Redis**: Added integration tests for Redis operations
  - Health check, SET/GET, expiration, increment operations
- **Contact API**: Added validation test for search endpoint with invalid page parameter (`5bc9b60`)
  - Tests that page=0 returns 400 validation error
- **Error Middleware**: Added test for generic error handling (`70c70d7`)
  - Created `test/error-middleware.test.ts`
  - Tests 500 error response for unexpected errors
- **Auth Middleware**: Added test for missing token scenario (`6f7d0b5`)
  - Tests that requests without X-API-TOKEN header return 401
- **User Registration**: Enhanced duplicate username test (`5130085`)

### Coverage Improvements
| File | Before | After |
|------|--------|-------|
| `user-controller.ts` | 91.3% | 100% |
| `user-service.ts` | 96.42% | 100% |
| `error-middleware.ts` | 83.33% | 100% |
| `auth-middleware.ts` | 75% branch | 100% |
| `contact-controller.ts` | 96.77% | 100% |
| **Overall** | **~95%** | **87.79%*** |

*Note: Overall coverage includes new Redis infrastructure code with uncovered error scenarios (acceptable edge cases)

---

## Commit Details

| Date (UTC+7) | Commit | Author | Description |
|--------------|--------|--------|-------------|
| 2026-04-10 08:00 | `7c2b158` | Claude Opus | test(user): add error handling tests for get and logout |
| 2026-04-10 00:50 | `06b47d0` | Claude Opus | feat(infra): add Redis integration with docker-compose |
| 2026-04-09 20:14 | `08af8ce` | Claude Opus | docs(plans): add security and JWT migration guides |
| 2026-04-08 18:07 | `0f8f214` | Helmi Pradita | docs: add changelog for chore/upgrade-deps-2026 branch |
| 2026-04-08 16:53 | `5bc9b60` | Helmi Pradita | test(api): add validation test for contact search page parameter |
| 2026-04-08 16:24 | `70c70d7` | Helmi Pradita | test(middleware): add test for generic error handling |
| 2026-04-08 15:44 | `6f7d0b5` | Helmi Pradita | test(auth): add test for missing token in current user endpoint |
| 2026-04-08 15:09 | `6f13c70` | Helmi Pradita | chore(deps): upgrade dependencies and enhance project documentation |
| 2026-04-08 15:09 | `5130085` | Helmi Pradita | test(test): add jest setup with database cleanup and enhance user registration tests |
| 2026-04-08 15:09 | `468d740` | Helmi Pradita | docs(planning): add 2026 enhancement and upgrade plans |
| 2026-04-08 15:08 | `7fd3a5b` | Helmi Pradita | docs(deps): incorporate offline reference guides for core packages |

---

## File Changes Summary

```
 .env                                          |   26 +-
 .gitignore                                    |    1 +
 CHANGELOG.md                                  |  126 ++-
 CLAUDE.md                                     |  261 ++
 INIT.md                                       |  387 ++
 babel.config.json                             |   11 +-
 docker-compose.yml                            |   44 +
 docs/README.md                                |  126 +
 docs/express.md                               |  281 ++
 docs/jest.md                                  |  446 +++
 docs/prisma.md                                |  355 ++
 docs/typescript.md                            |  415 ++
 docs/winston.md                               |  412 ++
 docs/zod.md                                   |  357 ++
 package-lock.json                             | 6605 +++++++++++++++++----------
 package.json                                  |   64 +-
 plans/001-vibe-engineer-enhancement.md        |  206 +
 plans/002-upgrade-node22-2026.md              |  477 ++
 plans/003-production-security-review.md       |  232 +
 plans/004-security-packages-guide.md          |  563 +++
 plans/005-redis-jwt-auth-migration-guide.md   |  791 ++++
 plans/README.md                               |   38 +
 src/application/redis.ts                      |  117 +
 src/main.ts                                   |   32 +-
 test/contact.test.ts                          |   13 +
 test/error-middleware.test.ts                 |   25 +
 test/jest.setup.ts                            |   13 +-
 test/redis.test.ts                            |   77 +
 test/test-util.ts                             |   77 +-
 test/user.test.ts                             |   68 +-
 tsconfig.json                                 |  126 +-
 31 files changed, 10222 insertions(+), 2519 deletions(-)
```

---

## Generated

Generated on **2026-04-10** from branch `chore/upgrade-deps-2026` vs `main`.
