# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

mlabs is an offline-first personal finance app — a TypeScript monorepo using **pnpm workspaces** and **Turbo** for orchestration. It ships in three forms: a self-hosted Docker image, a local web+API dev setup, and a macOS desktop app (Tauri shell wrapping the API as a Node sidecar).

```
apps/
  api/      # Hono backend (Node.js + SQLite via Drizzle)
  web/      # React frontend (Vite + TanStack Router)
  desktop/  # Tauri shell — bundles API + web for offline-first macOS
packages/
  db/       # Drizzle ORM schema, migrations, seed
  ui/       # shadcn/ui component library (Base UI under the hood)
  types/    # Shared Zod schemas + TypeScript types (incl. ApiEnvSchema)
  eslint-config/
  typescript-config/
```

## Commands

### Web + API development (most common)

```bash
pnpm install
cp .env.example .env
pnpm db:bootstrap          # Create SQLite schema (alias: db:setup)
pnpm db:bootstrap:seed     # Schema + sample data (alias: db:setup:seed)
pnpm dev                   # Runs api + web concurrently via Turbo
pnpm dev:api               # API only
pnpm dev:web               # Web only (Vite proxies /api → Hono)
```

`pnpm dev` is filtered to `--filter=api --filter=web` and **intentionally excludes `apps/desktop`** — the Tauri shell needs its own command (see below).

### Build, type check, lint, test

```bash
pnpm build                 # Build all packages (Turbo, --filter=^build)
pnpm typecheck             # tsc across the workspace
pnpm lint                  # ESLint across the workspace
pnpm lint:fix              # Auto-fix lint issues
pnpm format                # Prettier (will reformat any drifted files)
pnpm test                  # Turbo run test (vitest in packages that have it)

# Scope to one package:
pnpm --filter web typecheck
pnpm --filter api lint
pnpm --filter desktop test       # vitest run
```

Note: `pnpm format` may reformat unrelated files in `packages/ui` that have drifted from house style. Inspect `git status` after running it and `git checkout --` any unrelated changes.

### Database (Drizzle)

```bash
pnpm db:push               # Push schema.ts changes to the dev DB (no migration file)
pnpm db:generate           # Generate a migration file from schema.ts
pnpm db:studio             # Open Drizzle Studio
pnpm db:seed               # Seed only
pnpm db:reset              # Reset and re-seed
pnpm db:empty              # Clear all data
```

### Desktop (Tauri)

```bash
pnpm desktop:sidecar       # Build API + web, stage Tauri resources, copy node binary
pnpm desktop:dev           # Launch Tauri dev window (must run :sidecar first)
pnpm desktop:build         # Produce an unsigned DMG
pnpm desktop:smoke         # Headless smoke test of the staged sidecar (no GUI)
```

Prerequisites: macOS 11+, Node 22.x, pnpm 9.x, Xcode CLT, Rust stable. See `README.md` for full setup. The desktop app binds to `127.0.0.1:3001` and stores its DB at `~/Library/Application Support/app.mlabs.desktop/mlabs.db`.

### Docker

```bash
docker compose --profile full-stack up --build           # local
docker compose -f docker-compose.prod.yml up -d          # prod
DOMAIN=mlabs.yourdomain.com docker compose -f docker-compose.prod.yml up -d
```

## Architecture

### Multi-tenant via Profiles

All authenticated API calls require an `X-Profile-Id` header. The backend's `profileMiddleware` looks up the profile in the DB and attaches it to the Hono context. Profiles act as isolated workspaces (`PERSONAL` / `BUSINESS` / `SHARED`).

### API response envelope

Every endpoint returns:

```ts
type ApiResponse<T> = { success: boolean; data?: T; error?: { message: string; code?: string } }
```

The web's `apiClient()` (`apps/web/src/lib/api-client.ts`) sets the `X-Profile-Id` header and unwraps `ApiResponse<T>` so callers see `T` directly.

### Frontend data flow

1. React component → React Hook Form (forms) or Zustand (global state).
2. `apiClient()` → fetch.
3. **TanStack React Query** caches and manages server state.
4. Toast notifications via **Sonner**.

### Frontend routing & layout

- File-based routing via **TanStack Router** in `apps/web/src/routes/`. The route tree is generated into `apps/web/src/routeTree.gen.ts` — adding/renaming/removing a route file regenerates this on dev start, so don't hand-edit it.
- Bootstrap/onboarding gates (`AppGate`, `AppLoader`, `BootstrapGate`) wrap the main layout before rendering authenticated routes.
- Pages drive the global header (`AppHeader`) by calling `useLayoutConfig({ pageTitle, breadcrumbs?, headerActions?, mobileBackPath?, onMobileBack? })` from `@/features/layout`. The hook syncs to the layout slice in the Zustand store; `AppHeader` reads from there. Pages that set only `pageTitle` get a single-crumb fallback. Pages with multi-level navigation set `breadcrumbs: [{ label, to? }, ...]`.
- The global `⌘K` hotkey (in `apps/web/src/routes/__root.tsx`) opens the global `CommandDialog`. Mobile uses `AppBottombar` for primary navigation + the prominent `+` add-transaction button.

### Backend structure

- `apps/api/src/routes/` — Hono route handlers (thin; delegate to services)
- `apps/api/src/services/` — Business logic
- `apps/api/src/middleware/` — Auth (`profileMiddleware`), logging, error handling, validation
- `apps/api/src/serializers/` — Response shape transformation
- `apps/api/src/libs/env.ts` — Validates env via `ApiEnvSchema` from `@workspace/types`; exits on invalid config

### Database

SQLite via `@libsql/client` with Drizzle ORM. WAL mode enabled, foreign keys on. Schema lives in `packages/db/src/schema.ts`. Key tables: `profiles`, `accounts`, `categories`, `transactions`. **Transfers use double-entry** (two transaction rows linked by `transferId`). Amounts are stored as **strings** for numeric precision.

### Schema-drift hazard (read this before touching schema.ts)

Dev mode uses `pnpm db:push` which writes the schema directly to the dev DB **without producing a migration file**. The desktop app, however, applies real migrations from `packages/db/migrations/` on first launch. So schema changes that work in `pnpm dev` can fail at runtime in the desktop app as `SQLITE_ERROR`.

Safe workflow when changing `packages/db/src/schema.ts`:

1. Edit `schema.ts`.
2. `pnpm db:generate` — produces a new migration file under `packages/db/migrations/`.
3. **Review the generated SQL.** Drizzle occasionally emits SQL SQLite rejects (e.g., parameter placeholders in `CHECK` constraints) — fix by hand if needed.
4. Commit `schema.ts` and the new migration file together.
5. Re-run `pnpm desktop:sidecar` so the next DMG picks up the migration.

Don't share a single SQLite file between `pnpm dev` and the installed desktop app — `db:push` can silently diverge it from migration history. Treat them as separate databases (dev: `./data/mlabs.db`; desktop: `~/Library/Application Support/app.mlabs.desktop/mlabs.db`).

### UI component library

`packages/ui` is shadcn-style, but the underlying primitives are **Base UI** (not Radix). When passing a custom element to a slot, use the `render={<Custom />}` prop, not `asChild`. Examples: `BreadcrumbLink`, `DialogClose`, `AlertDialogClose`. See `packages/ui/src/components/breadcrumb.tsx` for the `useRender` pattern.

## Environment variables

See `.env.example`. Key vars:

- `DATABASE_URL` — Path to SQLite file (e.g., `./data/mlabs.db`)
- `NODE_ENV` — `development` or `production`
- `PORT` — Default **3001** (per `ApiEnvSchema`). The shipped `.env.example` overrides to **3000** for local dev; the Vite proxy and the desktop sidecar both expect 3001 in their respective contexts. If you change ports, update `.env`, the Vite proxy, and `CORS_ORIGIN` together.
- `CORS_ORIGIN` — Comma-separated allowed origins (Vite default: `http://localhost:5173`)
- `WEB_DIST_PATH` — Path to the built frontend (production / desktop only)

## Zod v4 note

The web app uses Zod v4, which has incompatibilities with React Hook Form's resolver typing in places. Look for `z.object().parse()` with manual error mapping in `apps/web/src` — that's the workaround pattern used in this repo.
