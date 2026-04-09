# Changelog

All notable changes from `main` branch to `chore/upgrade-deps-2026` branch.

## [Unreleased] - 2026-04-08

### Added
- **Documentation**: Offline reference guides for core packages (Express, Jest, Prisma, TypeScript, Winston, Zod)
- **Documentation**: Project planning docs (2026 enhancement and upgrade plans)
- **Documentation**: `CLAUDE.md` - AI assistant context file with project guidelines
- **Documentation**: `INIT.md` - Project initialization documentation
- **Documentation**: `docs/` directory with comprehensive package references
- **Test Setup**: `test/jest.setup.ts` - Database cleanup before each test suite

### Changed
- **Dependencies**: Upgraded all project dependencies to latest versions (2026-04-08)
  - Express: Major version upgrade
  - Prisma: Version bump
  - Jest: Latest version
  - TypeScript: Updated to v6
  - Zod: Updated to v4
  - Other dependencies: See package.json for details
- **TypeScript Config**: Updated `tsconfig.json` for stricter type checking
- **Babel Config**: Updated `babel.config.json` for compatibility
- **Test Utilities**: Enhanced `test/test-util.ts` with better helper functions

### Tests
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
| `user-service.ts` | 96.42% | 100% |
| `error-middleware.ts` | 83.33% | 100% |
| `auth-middleware.ts` | 75% branch | 100% |
| `contact-controller.ts` | 96.77% | 100% |
| **Overall** | **~95%** | **97.41%** |

---

## Commit Details

| Date (UTC+7) | Commit | Author | Description |
|--------------|--------|--------|-------------|
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
 .gitignore                             |    1 +
 CLAUDE.md                              |  261 ++
 INIT.md                                |  387 ++
 babel.config.json                      |   11 +-
 CHANGELOG.md                           |  116 +++ (new)
 docs/README.md                         |  126 +
 docs/express.md                        |  281 ++
 docs/jest.md                           |  446 +++
 docs/prisma.md                         |  355 ++
 docs/typescript.md                     |  415 ++
 docs/winston.md                        |  412 ++
 docs/zod.md                            |  357 ++
 package-lock.json                      | 6507 ++++++++++++++++++++------------
 package.json                           |   53 +-
 plans/001-vibe-engineer-enhancement.md |  206 +
 plans/002-upgrade-node22-2026.md       |  477 +++
 plans/README.md                        |   38 +
 test/contact.test.ts                   |   13 +
 test/error-middleware.test.ts          |   25 +
 test/jest.setup.ts                     |   11 +
 test/test-util.ts                      |   77 +-
 test/user.test.ts                      |   26 +
 tsconfig.json                          |  126 +-
 23 files changed, 8212 insertions(+), 2515 deletions(-)
```

---

## Generated

Generated on **2026-04-08** from branch `chore/upgrade-deps-2026` vs `main`.
