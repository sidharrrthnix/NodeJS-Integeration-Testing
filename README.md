# Node.js TypeScript Scaffold with Integration Testing

A production-ready Node.js/Express API boilerplate with TypeScript, PostgreSQL, JWT authentication, comprehensive integration testing, and Docker setup.

## Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 5
- **Database**: PostgreSQL + `pg` library
- **Language**: TypeScript 5
- **Auth**: JWT (jsonwebtoken)
- **Testing**: Vitest + Supertest
- **Validation**: Zod
- **Tools**: ESLint, Prettier, Docker Compose

## Quick Start

### Prerequisites
- Node.js ≥ 20
- Docker & Docker Compose
- Git

### Setup

```bash
# 1. Clone and install
git clone <repo>
cd integeration-testing
npm install

# 2. Environment variables
cp env-sample .env
# Edit .env if needed (default values work with docker-compose)

# 3. Start database
docker-compose up -d

# 4. Setup database schema
npm run dev
# The app will automatically create tables on startup

# 5. Start development server
npm run dev
```

Server runs on `http://localhost:3000`

## Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled app |
| `npm test` | Run tests |
| `npm run test:watch` | Watch mode for tests |
| `npm run test:cov` | Run tests with coverage |
| `npm run lint` | Check code with ESLint |
| `npm run format:write` | Format code with Prettier |
| `npm run docker:up` | Start PostgreSQL containers |
| `npm run docker:down` | Stop PostgreSQL containers |
| `npm run test:docker` | Start Docker then run tests |

## Project Structure

```
src/
├── db/               # Database connection & schema setup
├── errors/           # Custom error classes
├── lib/              # Utilities (env, jwt, password, etc)
├── middleware/       # Express middleware (auth, validation, etc)
├── repositories/     # Data access layer
├── routes/           # API endpoints
├── validation/       # Zod schemas
├── misc/             # Miscellaneous utilities
├── server.ts         # Express app setup
└── index.ts          # Entry point

test/
├── factories/        # Test data factories
├── helpers/          # Test utilities
├── integeration/     # Integration tests
└── *.test.ts         # Unit tests
```

## API Endpoints

### Health
- `GET /health` - Health check

### Users
- `POST /api/users` - Create user
- `POST /api/users/login` - Login (returns JWT)
- `GET /api/users` - List users (admin only)
- `GET /api/users/:id` - Get user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/transfer-credits` - Transfer credits between users

### Demo
- `GET /api/demo` - Demo endpoint

## Database

Uses PostgreSQL with the `pg` library. Schema includes:
- Users (with authentication and credits system)
- Automatic timestamps (created_at, updated_at)
- Email uniqueness constraints
- Credits transfer functionality

### Docker Setup

Two PostgreSQL containers for development and testing:
- `postgres-dev`: Development database (port 5432)
- `postgres-test`: Test database (port 5433)

## Authentication

JWT-based authentication:
- `POST /api/users/login` returns JWT token
- Include token in `Authorization: Bearer <token>` header
- Protected routes use `authenticate` middleware
- Admin-only routes use `requireAdmin` middleware

## Environment Variables

Create `.env` from `env-sample`:

```env
APP_NAME=my-app
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://devuser:devpass@localhost:5432/devdb
DB_SSL=false
DB_POOL_MAX=10
JWT_SECRET=your-jwt-secret-min-32-chars
```

## Testing

Comprehensive test suite with integration tests:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:cov

# Start test DB and run tests
npm run test:docker
```

### Test Structure
- **Unit Tests**: Repository and utility functions
- **Integration Tests**: Full API endpoint testing with database
- **Database Tests**: Connection pooling and transactions

## Development

### Database Schema

Schema is automatically created on app startup via `ensureSchema()`. The schema includes:
- Users table with authentication fields
- Indexes for performance
- Constraints for data integrity

### Adding New Features

1. **Database Models**: Add to `src/db/schema.ts`
2. **Repositories**: Create in `src/repositories/`
3. **API Routes**: Add to `src/routes/`
4. **Validation**: Define Zod schemas in `src/validation/`
5. **Tests**: Add integration tests in `test/integeration/`

## License

MIT
