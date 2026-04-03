# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

This is a pnpm monorepo using Turbo. Node.js >=20.20.0 required.

| Command          | Purpose                                |
| ---------------- | -------------------------------------- |
| `pnpm dev`       | Start all dev servers (web + api)      |
| `pnpm dev:web`   | Start Vite dev server only             |
| `pnpm dev:api`   | Start Hono API server only (tsx watch) |
| `pnpm build`     | Build all apps via Turbo               |
| `pnpm lint`      | Lint all packages                      |
| `pnpm lint:fix`  | Auto-fix lint issues                   |
| `pnpm typecheck` | Type-check all packages                |
| `pnpm format`    | Format all code (Prettier)             |
| `pnpm clean`     | Remove node_modules, dist, .turbo      |

Filter to a specific workspace: `pnpm --filter=web <script>` or `pnpm --filter=api <script>`

### Database (packages/db)

| Command              | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `pnpm db:create`     | Create database (if not exists)          |
| `pnpm db:drop`       | Drop the database                        |
| `pnpm db:generate`   | Generate Drizzle migrations              |
| `pnpm db:migrate`    | Run Drizzle migrations                   |
| `pnpm db:push`       | Push schema to database                  |
| `pnpm db:push:force` | Push schema with force (non-interactive) |
| `pnpm db:studio`     | Open Drizzle Studio                      |
| `pnpm db:seed`       | Seed database with sample data           |
| `pnpm db:reset`      | Drop, recreate, and seed database        |
| `pnpm db:setup`      | Full setup: create + push + seed         |

### Adding shadcn/ui Components

```bash
pnpm dlx shadcn@latest add <component> -c apps/web
```

Components are placed in `packages/ui/src/components/` and imported as:

```tsx
import { Button } from "@workspace/ui/components/button";
```

## Architecture

### Monorepo Structure

- **apps/web** — React 19 + Vite + TanStack Router frontend
- **apps/api** — Hono HTTP server (Node.js)
- **packages/db** — Drizzle ORM schema, migrations, seed (PostgreSQL)
- **packages/types** — Shared Zod schemas and TypeScript types
- **packages/ui** — Shared shadcn/ui component library (Radix + Tailwind v4)
- **packages/eslint-config** — Shared ESLint flat configs
- **packages/typescript-config** — Shared tsconfig bases

Workspace packages are referenced as `@workspace/*`.

### Web App Architecture (apps/web)

**Feature-based organization** in `src/features/`. Each feature is a self-contained module:

```
features/<name>/
├── components/     # Feature-specific UI
├── hooks/          # Feature-specific hooks
├── api/            # TanStack Query hooks (useQuery/useMutation)
├── store/          # Feature-specific Zustand stores
├── types.ts
└── index.ts        # Public API — only import features through this
```

**Key rules:**

- Features cannot import from other features (use public API via index.ts)
- `src/components/` is for pure, reusable UI only — no API calls, no global state
- `src/hooks/` is for shared hooks used by 2+ features
- `src/stores/` is for global UI state only (theme, modals, sidebar)
- Routes in `src/routes/` are thin orchestrators that import from features

**Placement decision:** If used by 1 feature → `features/<name>/`. If used by 2+ features and pure UI → `components/`. If shared logic → `hooks/` or `lib/`.

### State Management

- **Zustand** with `devtools`, `persist`, and `immer` middleware
- Global store in `src/lib/store/` with three slices: Filters, UI, Layout
- Server state belongs in TanStack Query hooks (`features/<name>/api/`), not Zustand
- Feature-specific state stays in `features/<name>/store/`

### Routing

TanStack Router v1 with file-based routing. Route tree is auto-generated in `routeTree.gen.ts`. Routes use `useLayoutConfig()` hook to set header title and actions per page.

### API Layer

- Backend uses Hono with `X-Profile-Id` header for multi-tenant profile selection
- All database tables include `profileId` for multi-tenant isolation
- `ApiResponse<T>` wrapper type: `{ success, data?, error? }`
- Environment: `VITE_API_URL` (frontend), `CORS_ORIGIN` and `DATABASE_URL` (backend)

### Naming Conventions

| Type       | File                | Export                 |
| ---------- | ------------------- | ---------------------- |
| Components | `PascalCase.tsx`    | `PascalCase`           |
| Hooks      | `use-kebab-case.ts` | `useCamelCase`         |
| Stores     | `*-store.ts`        | `use*Store`            |
| API hooks  | `use-verb-noun.ts`  | `useVerbNoun`          |
| Constants  | any                 | `SCREAMING_SNAKE_CASE` |
