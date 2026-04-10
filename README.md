# belajar-typescript-restful-api

Production-ready RESTful API for contact management with nested addresses.

## Features

- ✅ User registration and authentication
- ✅ Contact management (CRUD)
- ✅ Address management with nested contacts
- ✅ Pagination support
- ✅ Search and filtering
- ✅ TypeScript with strict mode
- ✅ Zod validation
- ✅ Prisma ORM
- ✅ Winston logging
- ✅ 87%+ test coverage

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Runtime | Node.js | 20+ |
| Language | TypeScript | 6.0.2 |
| Framework | Express | 5.2.1 |
| ORM | Prisma | 6.0.0 |
| Validation | Zod | 4.3.6 |
| Testing | Jest | 30.3.0 |
| Logging | Winston | 3.19.0 |

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run db:migrate:dev

# Start development server
npm run dev

# Run tests
npm test
```

## API Endpoints

### Public Routes
- `POST /api/users` - Register user
- `POST /api/users/login` - Login

### Protected Routes (require `X-API-TOKEN` header)
- `GET /api/users/current` - Get current user
- `PATCH /api/users/current` - Update user
- `DELETE /api/users/current` - Logout
- `POST /api/contacts` - Create contact
- `GET /api/contacts` - Search contacts
- `GET /api/contacts/:id` - Get contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `POST /api/contacts/:contactId/addresses` - Create address
- `GET /api/contacts/:contactId/addresses` - List addresses
- `GET /api/contacts/:contactId/addresses/:addressId` - Get address
- `PUT /api/contacts/:contactId/addresses/:addressId` - Update address
- `DELETE /api/contacts/:contactId/addresses/:addressId` - Delete address

See [API.md](./API.md) for complete API documentation.

## Development

### Available Scripts

```bash
npm run dev              # Start with hot reload
npm run build            # Compile to dist/
npm run start            # Start production server
npm test                 # Run all tests
npm run test:coverage    # Run tests with coverage
npm run lint             # Check code
npm run db:studio        # Open Prisma Studio
npm run db:migrate:dev   # Run migrations
npm run db:generate      # Generate Prisma Client
```

### Project Structure

```
src/
├── application/          # Application setup
│   ├── database.ts      # Prisma client
│   ├── logging.ts       # Winston logger
│   ├── redis.ts         # Redis client
│   └── web.ts           # Express app
├── controller/          # HTTP controllers
├── middleware/          # Express middleware
├── model/              # DTOs
├── route/              # API routes
├── service/            # Business logic
├── validation/         # Zod schemas
└── main.ts             # Entry point
```

## Documentation

- [API.md](./API.md) - Complete API specification
- [CLAUDE.md](./CLAUDE.md) - AI assistant context
- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [docs/](./docs) - Package references and guides

## License

ISC
