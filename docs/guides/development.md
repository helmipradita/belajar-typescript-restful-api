# Development Guide

Complete guide for setting up and developing the belajar-typescript-restful-api project.

## Prerequisites

- Node.js 20+
- MySQL 5.7+ or MariaDB 10.3+
- Git

## Initial Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd belajar-typescript-restful-api
npm install
```

### 2. Environment Configuration

Create `.env` file from example:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/database_name
CORS_ORIGIN=http://localhost:5173
```

### 3. Database Setup

Run migrations:

```bash
npm run db:migrate:dev
npm run db:generate
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Development Workflow

### Code Structure

The project follows a layered architecture:

```
Controller (HTTP) → Service (Business Logic) → Prisma (Database)
                ↓
            Validation (Zod)
                ↓
             Models (DTOs)
```

### File Naming Conventions

- Controllers: `*-controller.ts`
- Services: `*-service.ts`
- Models: `*-model.ts`
- Validation: `*-validation.ts`
- Middleware: `*-middleware.ts`
- Tests: `*.test.ts`

### Adding a New Feature

1. Create validation schema in `src/validation/`
2. Create model interface in `src/model/`
3. Create service in `src/service/`
4. Create controller in `src/controller/`
5. Add routes in `src/route/api.ts` or `src/route/public-api.ts`
6. Add tests in `test/`
7. Update API.md

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Run specific test file
npm test -- test/user.test.ts
```

### Database Operations

```bash
# Open Prisma Studio (GUI)
npm run db:studio

# Run migration
npm run db:migrate:dev

# Generate Prisma Client
npm run db:generate

# Reset database (WARNING: deletes all data)
npm run db:migrate:dev reset
```

## Debugging

### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Program",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/dist/main.js",
      "preLaunchTask": "npm: build"
    }
  ]
}
```

### Type Check

```bash
npx tsc --noEmit
```

## Code Quality

### Linting

```bash
npm run lint           # Check code
npm run lint:fix       # Auto-fix issues
```

### Formatting

```bash
npm run format         # Format with Prettier
```

## Common Issues

### Migration Errors

If you encounter migration errors:

```bash
# Reset migration
npm run db:migrate:dev reset

# Or create a new migration
npm run db:migrate:dev --name new_migration
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 <PID>
```

### Database Connection Issues

1. Check MySQL is running
2. Verify DATABASE_URL in `.env`
3. Check MySQL credentials

## Production Build

```bash
# Build
npm run build

# Start production server
npm start
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with hot reload |
| `npm run build` | Compile to dist/ |
| `npm test` | Run all tests |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:migrate:dev` | Run migrations |
| `npm run db:generate` | Generate Prisma Client |

## Additional Resources

- [API Documentation](../API.md)
- [Package References](./packages)
- [Architecture Overview](./architecture/overview.md)
