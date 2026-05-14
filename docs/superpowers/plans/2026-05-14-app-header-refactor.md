# AppHeader Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded desktop breadcrumbs in `AppHeader` with store-driven crumbs (page-title fallback), and add dedicated desktop **Search** and **Add transaction** controls.

**Architecture:** All changes live inside `apps/web/src/features/layout/components/AppHeader.tsx`. No store changes — the existing `layout-slice` already exposes `breadcrumbs: Breadcrumb[] | null`, `headerTitle`, `headerActions`. Both new buttons reuse already-imported actions from `useUiActions()` (`setGlobalSearch`, `setOpenCreateTransaction`) and the `backendStatus` selector. Breadcrumbs are rendered with the existing `@workspace/ui/components/breadcrumb` primitives, using Base UI's `render={<Link ... />}` slot pattern (`BreadcrumbLink` uses `useRender`, see `packages/ui/src/components/breadcrumb.tsx:42-60`). Mobile branch is left untouched.

**Tech Stack:** React 19 + TypeScript, TanStack Router (`Link`), Zustand (`useAppStore`/`useUiActions`/`useHeaderConfig`), shadcn UI primitives in `@workspace/ui/components/*`, Tailwind utility classes.

**Spec:** `docs/superpowers/specs/2026-05-14-app-header-refactor-design.md`

---

## File Structure

- **Modify:** `apps/web/src/features/layout/components/AppHeader.tsx`
  - Remove the hardcoded "Build Your Application / Data Fetching" placeholder.
  - Add `crumbs` derivation (`breadcrumbs` from store, falling back to `[{ label: pageTitle }]`).
  - Render crumbs as a `.map(...)` over `BreadcrumbItem` + `BreadcrumbSeparator`, with `BreadcrumbLink render={<Link to={c.to}>...</Link>}` for non-terminal crumbs that have a `to`, and `BreadcrumbPage` for the last crumb (or any crumb without `to`).
  - Add right-cluster on desktop: `headerActions` slot, then a Search button (icon + `⌘K`), then a primary Add transaction button (`+` + label).
  - Mobile branch stays as-is.

No new files. No tests added (the `layout` feature has no test infrastructure today; verification is manual per the spec).

---

## Pre-flight (one-time)

- [ ] **Step 0.1: Confirm working tree is clean and on the right branch**

Run:
```
git status
git rev-parse --abbrev-ref HEAD
```

Expected: working tree clean, branch is `feature/new-sidebar` (or whatever the current feature branch is). If dirty, stash or commit before proceeding.

- [ ] **Step 0.2: Confirm the dev environment runs**

Run:
```
pnpm install
pnpm dev:web
```

Expected: Vite serves the web app (default `http://localhost:5173` or similar — read the actual URL from the terminal). Open it in a browser, navigate to `/dashboard`, and confirm you see the current header (with the placeholder "Build Your Application / Data Fetching" crumbs on desktop). Leave the dev server running for the rest of this plan.

- [ ] **Step 0.3: Confirm the API runs (for backend-disconnected verification later)**

In a second terminal:
```
pnpm db:bootstrap:seed   # only if you don't already have a DB
pnpm dev:api
```

Expected: API starts on `http://localhost:3001`. The web app's connection indicator (top-right or similar) goes to "connected".

---

## Task 1: Replace hardcoded desktop breadcrumbs with store-driven crumbs (with page-title fallback)

**Files:**
- Modify: `apps/web/src/features/layout/components/AppHeader.tsx`

- [ ] **Step 1.1: Add the `Link` and `Fragment` imports and a typed `Breadcrumb` import**

Open `apps/web/src/features/layout/components/AppHeader.tsx`. At the top of the file, alongside the existing imports, add:

```tsx
import { Fragment } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { Breadcrumb as BreadcrumbType } from "@/stores/slices/layout-slice";
```

Note: `useNavigate` is already imported — keep the existing import line and just add `Fragment`, `Link`, and `BreadcrumbType`. The merged import block at the top of the file should look like:

```tsx
import { Fragment } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useHeaderConfig } from "@/hooks/use-layout";
import { useUiActions } from "@/hooks/use-ui-store";
import { useAppStore } from "@/stores";
import type { Breadcrumb as BreadcrumbType } from "@/stores/slices/layout-slice";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";
import { ArrowLeftIcon, PlusIcon, SearchIcon } from "lucide-react";
```

(Adding `PlusIcon` to the `lucide-react` import now so we don't bounce on it again in Task 3.)

- [ ] **Step 1.2: Derive `crumbs` from `breadcrumbs` + `pageTitle`**

Inside the `AppHeader` function body, just below the line that destructures `useHeaderConfig()` and just above `const showBackButton = ...`, add:

```tsx
const crumbs: BreadcrumbType[] =
  breadcrumbs && breadcrumbs.length > 0
    ? breadcrumbs
    : [{ label: pageTitle }];
```

This guarantees there is always at least one crumb — the active page's title — so we never need null-checks below.

- [ ] **Step 1.3: Replace the hardcoded `<Breadcrumb>` block with a mapped render**

In `renderDesktopHeader`, replace the entire `<Breadcrumb>...</Breadcrumb>` block (currently lines that render `"Build Your Application"` and `"Data Fetching"`) with:

```tsx
<Breadcrumb>
  <BreadcrumbList>
    {crumbs.map((c, i) => {
      const isLast = i === crumbs.length - 1;
      return (
        <Fragment key={`${c.label}-${i}`}>
          <BreadcrumbItem>
            {isLast || !c.to ? (
              <BreadcrumbPage>{c.label}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink render={<Link to={c.to} />}>
                {c.label}
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {!isLast && <BreadcrumbSeparator />}
        </Fragment>
      );
    })}
  </BreadcrumbList>
</Breadcrumb>
```

Why `render={<Link ... />}`: the `BreadcrumbLink` in `packages/ui/src/components/breadcrumb.tsx:42-60` uses Base UI's `useRender`, which forwards via the `render` prop. This is the same slot pattern used elsewhere (`packages/ui/src/components/alert-dialog.tsx:168`, `packages/ui/src/components/dialog.tsx:110`) — passing a JSX element to `render` swaps the underlying tag and lets TanStack Router's `<Link>` handle navigation without a page reload.

- [ ] **Step 1.4: Typecheck and lint**

Run:
```
pnpm --filter web typecheck
pnpm --filter web lint
```

Expected: both clean. If `BreadcrumbType` triggers an unused-import warning, you may have not actually annotated `crumbs` — re-check Step 1.2. If TanStack Router complains about `to` typing, ensure you're using the same path strings the store stores (they originate from `@/constants` typed against `FileRoutesByPath`).

- [ ] **Step 1.5: Manual verification — fallback crumb on simple pages**

In the browser, with the dev server running:
- `/dashboard` → header shows a single crumb reading `Dashboard`.
- `/accounts` → `Accounts`.
- `/budget` → `Budget`.
- `/net-worth` → `Net Worth`.
- `/goals` → `Goals`.
- `/subscriptions` → `Subscriptions`.
- `/categories` → `Categories`.
- `/settings` → `Settings`.

Expected: no occurrence of "Build Your Application" or "Data Fetching" anywhere. The mobile (≤ md) branch is unchanged — narrow the window to confirm.

- [ ] **Step 1.6: Manual verification — multi-level crumb on Transactions**

Navigate to `/transactions`. Apply an account filter (this is what flips `isAccountScoped` to `true` in `apps/web/src/features/transactions/TransactionsPage.tsx:120`). The desktop crumb should read:

```
Accounts › Transactions
```

Click the `Accounts` crumb. Expected: TanStack Router navigates to `/accounts` without a full page reload. Watch the Network tab — there should be no document request, only any data fetches the route triggers.

- [ ] **Step 1.7: Commit**

```
git add apps/web/src/features/layout/components/AppHeader.tsx
git commit -m "[web] drive AppHeader breadcrumbs from store with page-title fallback"
```

---

## Task 2: Add desktop Search button (icon + ⌘K)

**Files:**
- Modify: `apps/web/src/features/layout/components/AppHeader.tsx`

- [ ] **Step 2.1: Wrap the desktop header in a flex container with a right cluster**

In `renderDesktopHeader`, the outer container already uses `md:flex md:items-center md:justify-between`. The left cluster (`SidebarTrigger` + `Separator` + `Breadcrumb`) is already there. Add the right cluster as a sibling div placed **after** the left cluster's closing `</div>`:

```tsx
<div className="flex items-center gap-2">
  {headerActions}
  <Button
    variant="outline"
    size="sm"
    onClick={() => setGlobalSearch(true)}
    disabled={!isBackendConnected}
    aria-label="Search"
  >
    <SearchIcon className="size-4" />
    <span className="text-xs text-muted-foreground">⌘K</span>
  </Button>
</div>
```

The full `renderDesktopHeader` should now read:

```tsx
const renderDesktopHeader = () => (
  <div className="hidden md:flex md:w-full md:items-center md:justify-between md:gap-2 md:px-4">
    <div className="flex min-w-0 items-center gap-2">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <Fragment key={`${c.label}-${i}`}>
                <BreadcrumbItem>
                  {isLast || !c.to ? (
                    <BreadcrumbPage>{c.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link to={c.to} />}>
                      {c.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
    <div className="flex items-center gap-2">
      {headerActions}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setGlobalSearch(true)}
        disabled={!isBackendConnected}
        aria-label="Search"
      >
        <SearchIcon className="size-4" />
        <span className="text-xs text-muted-foreground">⌘K</span>
      </Button>
    </div>
  </div>
);
```

Note: The original outer div used `md:flex md:items-center md:justify-between md:gap-2 md:px-4` without `md:w-full`. Add `md:w-full` so the flex container actually fills the available width inside the `<header>` (otherwise `justify-between` has nothing to spread). If you find the existing `<header>` already provides full-width children via flex, you can omit `md:w-full` — but verify by inspecting the browser's computed width.

- [ ] **Step 2.2: Typecheck and lint**

Run:
```
pnpm --filter web typecheck
pnpm --filter web lint
```

Expected: both clean.

- [ ] **Step 2.3: Manual verification — search opens dialog**

In the browser at `/dashboard`:
- Click the new search button. Expected: the global `CommandDialog` (`apps/web/src/components/SearchDialog.tsx`) opens.
- Press `Escape` to close it.
- Press `⌘K`. Expected: the same dialog opens (via the existing hotkey in `apps/web/src/routes/__root.tsx:64-70`).
- Visit `/transactions`. Confirm the existing `TimeGrainSelect` (rendered via `headerActions`) still appears, immediately to the left of the search button.

- [ ] **Step 2.4: Manual verification — disabled when backend disconnected**

Stop the API process (`Ctrl+C` the terminal running `pnpm dev:api`). Wait until the web app's connection indicator flips away from "connected" (the polling interval lives in `apps/web/src/hooks/use-health-check.ts` — should be a few seconds). Expected: the search button is visibly disabled and clicking does nothing.

Restart the API (`pnpm dev:api`) before continuing.

- [ ] **Step 2.5: Commit**

```
git add apps/web/src/features/layout/components/AppHeader.tsx
git commit -m "[web] add desktop search button to AppHeader"
```

---

## Task 3: Add desktop Add Transaction primary button

**Files:**
- Modify: `apps/web/src/features/layout/components/AppHeader.tsx`

- [ ] **Step 3.1: Add the Add Transaction button**

Inside the right-cluster `<div className="flex items-center gap-2">`, append a second button **after** the search `<Button>`:

```tsx
<Button
  variant="default"
  size="sm"
  onClick={handleAddTransaction}
  disabled={!isBackendConnected}
>
  <PlusIcon className="size-4" />
  <span>Add transaction</span>
</Button>
```

Result — the right cluster now reads:

```tsx
<div className="flex items-center gap-2">
  {headerActions}
  <Button
    variant="outline"
    size="sm"
    onClick={() => setGlobalSearch(true)}
    disabled={!isBackendConnected}
    aria-label="Search"
  >
    <SearchIcon className="size-4" />
    <span className="text-xs text-muted-foreground">⌘K</span>
  </Button>
  <Button
    variant="default"
    size="sm"
    onClick={handleAddTransaction}
    disabled={!isBackendConnected}
  >
    <PlusIcon className="size-4" />
    <span>Add transaction</span>
  </Button>
</div>
```

The existing `handleAddTransaction` function (already in this file, lines around 32-35 of the pre-refactor source) already gates on `isBackendConnected` and calls `setOpenCreateTransaction(true)` — no changes needed.

- [ ] **Step 3.2: Typecheck and lint**

Run:
```
pnpm --filter web typecheck
pnpm --filter web lint
```

Expected: both clean. (`PlusIcon` was added to the `lucide-react` import in Task 1.1.)

- [ ] **Step 3.3: Manual verification — opens AddTransactionPopover**

In the browser at `/dashboard`:
- Click "Add transaction". Expected: the `AddTransactionPopover` dialog opens (the same dialog that opens from the bottom bar's primary `+` on mobile and from inside the transactions page).
- Fill the form and submit. Expected: the dialog closes and the new transaction appears on `/transactions`.

- [ ] **Step 3.4: Manual verification — disabled when backend disconnected**

Stop `pnpm dev:api`. Wait for the connection indicator to flip. Expected: the "Add transaction" button is visibly disabled and clicking does nothing. Restart the API.

- [ ] **Step 3.5: Commit**

```
git add apps/web/src/features/layout/components/AppHeader.tsx
git commit -m "[web] add desktop Add Transaction button to AppHeader"
```

---

## Task 4: End-to-end verification sweep

**Files:** none modified — pure verification.

- [ ] **Step 4.1: Build the web app**

Run:
```
pnpm --filter web build
```

Expected: build succeeds with no errors. Watch for any new warnings about unused imports in `AppHeader.tsx`.

- [ ] **Step 4.2: Typecheck the whole repo**

Run:
```
pnpm typecheck
```

Expected: clean.

- [ ] **Step 4.3: Lint the whole repo**

Run:
```
pnpm lint
```

Expected: clean.

- [ ] **Step 4.4: Format**

Run:
```
pnpm format
```

Expected: no diff (the file should already be Prettier-clean, but this catches any drift).

- [ ] **Step 4.5: Manual sweep across all main routes**

With both `pnpm dev:api` and `pnpm dev:web` running, walk every authenticated route in this list and confirm the desktop header on each:

| Route | Expected crumb(s) | Notes |
|-------|-------------------|-------|
| `/dashboard` | `Dashboard` | Single fallback crumb |
| `/transactions` (no filters) | `Transactions` | Single fallback crumb |
| `/transactions` (account-scoped) | `Accounts` › `Transactions` | First crumb is a TanStack Router `Link` |
| `/accounts` | `Accounts` | |
| `/budget` | `Budget` | |
| `/net-worth` | `Net Worth` | |
| `/goals` | `Goals` | |
| `/subscriptions` | `Subscriptions` | |
| `/categories` | `Categories` | |
| `/settings` | `Settings` | |

For every route, confirm:
- Search button + `⌘K` hint visible on the right.
- Add transaction button visible on the right.
- `headerActions` (e.g. `TimeGrainSelect` on `/transactions`) renders to the left of the search button.
- Sidebar collapses to icons via `SidebarTrigger` and the header height transitions per the existing `group-has-data-[collapsible=icon]/sidebar-wrapper:h-12` class on `<header>`.
- No occurrence of "Build Your Application" or "Data Fetching" in the entire app.

- [ ] **Step 4.6: Mobile sweep**

Resize the browser to a mobile width (or use device-mode DevTools). On any route, confirm:
- Mobile branch renders: optional back button + page title on the left, header actions + search button on the right.
- No "Add transaction" button in the mobile header (per spec — the bottom bar already has one).
- Search button still opens `CommandDialog`.
- `/transactions` from an account context still shows the back arrow (`mobileBackPath` / `onMobileBack` flow in `apps/web/src/features/transactions/TransactionsPage.tsx:122-138`).

- [ ] **Step 4.7: Commit any housekeeping**

If `pnpm format` produced changes:
```
git add -A
git commit -m "[web] format AppHeader after refactor"
```

Otherwise this step is a no-op.

---

## Done

The desktop header now reflects the active page (single fallback crumb or page-supplied multi-level crumbs), and exposes one-click access to global search and "Add transaction". Mobile is unchanged. No store changes, no new files, no new tests.
