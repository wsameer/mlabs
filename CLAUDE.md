# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

mlabs is a self-hosted personal finance app — a TypeScript monorepo using *pnpm workspaces* and *Turbo* for orchestration.


apps/
  api/     # Hono backend (Node.js + SQLite)
  web/     # React frontend (Vite + TanStack Router)
packages/
  db/      # Drizzle ORM schema, migrations, seed
  ui/      # shadcn/ui component library
  types/   # Shared Zod schemas and TypeScript types
  eslint-config/
  typescript-config/


## Commands

### Development
bash
pnpm install
cp .env.example .env
pnpm db:bootstrap          # Create SQLite schema
pnpm db:bootstrap:seed     # Create schema + seed sample data
pnpm dev                   # Run API + web concurrently (Turbo)
pnpm dev:api               # Run API only
pnpm dev:web               # Run web only


### Build & Type Check
bash
pnpm build                 # Build all packages (Turbo)
pnpm typecheck             # TypeScript type check all
pnpm lint                  # Lint all
pnpm lint:fix              # Auto-fix lint issues
pnpm format                # Format with Prettier


### Database (Drizzle)
bash
pnpm db:push               # Push schema changes to DB
pnpm db:generate           # Generate migration files
pnpm db:studio             # Open Drizzle Studio
pnpm db:seed               # Seed data only
pnpm db:reset              # Reset and re-seed
pnpm db:empty              # Clear all data


### Docker
bash
docker compose --profile full-stack up --build


## Architecture

### Multi-tenant via Profiles
All authenticated API calls require an X-Profile-Id header. The backend profileMiddleware extracts the profile from the DB and attaches it to the Hono context. Profiles act as isolated workspaces (PERSONAL/BUSINESS/SHARED).

### API Response Format
All endpoints return a consistent wrapper:
typescript
type ApiResponse<T> = { success: boolean; data?: T; error?: { message: string; code?: string } }


### Frontend Data Flow
1. React component → React Hook Form (forms) or Zustand (global state)
2. apiClient() utility (apps/web/src/lib/api-client.ts) sets X-Profile-Id header and unwraps ApiResponse<T>
3. TanStack React Query caches and manages server state
4. Toast notifications via Sonner

### Frontend Routing
File-based routing via TanStack Router (apps/web/src/routes/). The app uses bootstrap/onboarding gates (AppGate, AppLoader, BootstrapGate) before rendering the main layout.

### Backend Structure
- apps/api/src/routes/ — Route handlers (thin, delegate to services)
- apps/api/src/services/ — Business logic
- apps/api/src/middleware/ — Auth, logging, error handling, validation
- apps/api/src/serializers/ — Response shape transformation

### Database
SQLite via @libsql/client with Drizzle ORM. WAL mode enabled, foreign keys on. Schema lives in packages/db/src/schema.ts. Key tables: profiles, accounts, categories, transactions. Transfers use double-entry (linked by transferId). Amounts stored as strings for numeric precision.

## Environment Variables

See .env.example. Key vars:
- DATABASE_URL — Path to SQLite file (e.g., ./data/mlabs.db)
- NODE_ENV — development or production
- PORT — Default 3001
- CORS_ORIGIN — Comma-separated allowed origins
- WEB_DIST_PATH — Path to built frontend (production only)

## Zod v4 Note
The web app uses Zod v4 which has some incompatibilities with React Hook Form. See apps/web/src for workarounds (z.object().parse() with manual error mapping where needed).
