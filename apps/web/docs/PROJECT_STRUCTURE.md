# Core Principles

- **Colocation**: Keep related code close to where it's used
- **Separation of Concerns**: Pure UI vs. business logic vs. routing
- **Single Responsibility**: Each folder has one clear purpose
- **Progressive Disclosure**: Move to shared only when actually shared

# Directory Structure

```
apps/web/
├── src/
│   ├── features/           # Feature modules (business logic + UI)
│   │   ├── auth/
│   │   │   ├── components/      # Feature-specific components
│   │   │   ├── hooks/           # Feature-specific hooks
│   │   │   ├── api/             # API calls (TanStack Query hooks)
│   │   │   │   ├── use-login.ts
│   │   │   │   ├── use-signup.ts
│   │   │   │   └── queries.ts   # Query keys & functions
│   │   │   ├── store/           # Feature-specific state (Zustand)
│   │   │   │   └── use-auth-form-store.ts
│   │   │   ├── types.ts         # Feature types (single file preferred)
│   │   │   ├── utils.ts         # Feature utilities (single file preferred)
│   │   │   └── index.ts         # Public API (exports only what other features need)
│   │   └── dashboard/
│   │       ├── components/
│   │       ├── api/
│   │       │   ├── use-get-stats.ts
│   │       │   └── use-update-widget.ts
│   │       ├── store/
│   │       │   └── use-dashboard-filters.ts
│   │       └── index.ts
│   │
│   ├── components/         # Pure, reusable UI components (flat structure)
│   │   ├── ui/            # shadcn components (from workspace)
│   │   ├── Button.tsx     # Simple components: single file
│   │   ├── DataTable/     # Complex components: folder with sub-components
│   │   │   ├── DataTable.tsx
│   │   │   ├── DataTablePagination.tsx
│   │   │   └── index.ts
│   │   ├── Avatar.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   │
│   ├── hooks/             # Shared hooks (used by 2+ features)
│   │   ├── use-debounce.ts
│   │   ├── use-media-query.ts
│   │   └── use-local-storage.ts
│   │
│   ├── lib/               # Third-party integrations & configs
│   │   ├── api.ts         # API client setup (axios/fetch)
│   │   ├── query-client.ts # TanStack Query config
│   │   └── utils.ts       # Shared utilities (cn, formatters)
│   │
│   ├── stores/            # Global UI state only (Zustand)
│   │   ├── ui-store.ts         # Loading, modals, sidebar
│   │   ├── layout-store.ts     # Header, sidebars visibility
│   │   └── index.ts
│   │
│   ├── constants/         # App-wide constants
│   │   └── routes.ts      # Route path constants
│   │
│   ├── routes/            # TanStack Router file-based routing
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   └── dashboard.tsx
│   │
│   └── types/             # Shared types & schemas
│       ├── api.ts         # Common API types
│       └── models.ts      # Shared domain models
```

## Rules

### 1. Features (`features/`)

- Contains ALL code for a specific domain/feature
- Can import from `components/`, `hooks/`, `lib/`, `stores/`, `types/`, `constants/`
- Cannot import from other `features/` (use public API via `index.ts` when ESLint rule is added)
- Should NOT be imported by `components/` (breaks purity)
- Move to shared: Only when 2+ features need it

#### Public API (`features/[name]/index.ts`):

- Each feature exposes a single `index.ts` with its public API
- Only export what other features/routes actually need
- Keep exports minimal to maintain encapsulation
- Note: Avoid barrel files within feature subfolders (hurts Vite tree-shaking)

```ts
// features/auth/index.ts
export { LoginForm } from "./components/LoginForm";
export { useAuth } from "./hooks/use-auth";
export type { User } from "./types";
// Don't re-export everything - only public API
```

#### API Layer (`features/[name]/api/`):

- All TanStack Query hooks (useQuery, useMutation) for this feature
- Query keys and query functions
- Example: `use-get-dashboard-stats.ts`, `use-update-widget.ts`

#### Store Layer (`features/[name]/store/`):

- Feature-specific Zustand stores
- UI state that doesn't belong in global stores
- Examples: form state, filters, local preferences

### 2. Components (`components/`)

- Pure, deterministic UI (same props = same output)
- Only local state (useState) and props
- No API calls, no global state, no business logic
- No `features/` imports
- **Structure**: Flat organization
  - Simple components: single file (`Button.tsx`)
  - Complex components: folder with sub-components (`DataTable/`)
  - Avoid: `components/buttons/`, `components/forms/`
  - Prefer: `components/Button.tsx`, `components/LoginForm.tsx`

### 3. Hooks (`hooks/`)

- Shared custom hooks used by multiple features
- Generic, reusable logic (e.g., `useDebounce`, `useMediaQuery`, `useLocalStorage`)
- Feature-specific hooks stay in `features/[name]/hooks/`
- No TanStack Query wrappers (those go in `features/[name]/api/`)

### 4. Routes (`routes/`)

- Only routing configuration and layouts
- Lazy load feature components
- No business logic or data fetching in route files
- Route files are thin orchestrators that import from features

```tsx
// routes/dashboard.tsx
import { DashboardPage } from "@/features/dashboard";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});
```

### 5. Stores (`stores/`)

- Only global UI state (theme, modals, sidebar, notifications)
- Not for server state (use TanStack Query in `features/[name]/api/`)
- Not for feature-specific state (keep in `features/[name]/store/`)
- Examples of global UI state:
  - Theme/dark mode preferences
  - Global modals/drawers state
  - Sidebar collapsed/expanded state
  - Toast notifications
  - Layout configuration (header, sidebars)

### 6. Lib (`lib/`)

- Third-party library configurations and wrappers
- Shared utility functions used across features
- Not for feature-specific utilities

### 7. Constants (`constants/`)

- App-wide constants (route paths, config values)
- Feature-specific constants stay in `features/[name]/`

## Naming Conventions

| Type       | Convention                                       | Example                                  |
| ---------- | ------------------------------------------------ | ---------------------------------------- |
| Components | PascalCase                                       | `DashboardStatsCard.tsx`                 |
| Hooks      | `use-*` kebab-case file, `use*` camelCase export | `use-debounce.ts` → `useDebounce`        |
| Stores     | `*-store` kebab-case file, `use*Store` export    | `ui-store.ts` → `useUiStore`             |
| API hooks  | `use-verb-noun` pattern                          | `use-get-stats.ts`, `use-create-user.ts` |
| Types      | PascalCase                                       | `User`, `DashboardFilter`                |
| Constants  | SCREAMING_SNAKE_CASE                             | `DASHBOARD_ROUTE`                        |

## Cross-Feature Communication

When features need to share data (ESLint rule to enforce this is planned):

1. **Shared types** → `types/`
2. **Events/callbacks** → Pass through route props or global stores
3. **Shared server data** → If 2+ features need the same data, consider:
   - Elevating the query to a shared location
   - Using route loaders to prefetch and share via context
4. **Public API** → Import only from `features/[name]/index.ts`

## Quick Decision Tree

### Where does it go?

| Scenario                        | Location                                |
| ------------------------------- | --------------------------------------- |
| Used by 1 feature only          | `features/[name]/`                      |
| Used by 2+ features + pure UI   | `components/`                           |
| Used by 2+ features + has logic | `hooks/` or `lib/`                      |
| Global UI state                 | `stores/`                               |
| Server state / API calls        | `features/[name]/api/` (TanStack Query) |
| Feature-specific state          | `features/[name]/store/` (Zustand)      |

## Examples

### Good: Feature with proper separation

```
features/dashboard/
├── api/
│   ├── use-get-stats.ts        # TanStack Query hook
│   └── queries.ts              # Query keys
├── store/
│   └── use-dashboard-filters.ts # Local filter state
├── components/
│   ├── StatsCard.tsx           # Feature component
│   └── WidgetGrid.tsx
├── types.ts
└── index.ts                    # Public API
```

### Bad: Mixed responsibilities

```
components/
├── buttons/              # Don't organize by type
│   └── SubmitButton.tsx
├── DashboardStats.tsx   # Has API calls - should be in features/
└── forms/
    └── LoginForm.tsx    # Uses auth store - should be in features/
```

### Good: Flat component structure

```
components/
├── Button.tsx           # Simple: single file
├── DataTable/           # Complex: folder
│   ├── DataTable.tsx
│   └── index.ts
└── Avatar.tsx
```

### Good: Clear state boundaries

```
# Global UI state
stores/ui-store.ts

# Feature-specific state
features/dashboard/store/use-dashboard-filters.ts

# Server state
features/dashboard/api/use-get-stats.ts
```

### Good: Route-Feature relationship

```tsx
// routes/dashboard.tsx - thin orchestrator
import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});
```
