# AppHeader Refactor — Design

**Date:** 2026-05-14
**Scope:** `apps/web/src/features/layout/components/AppHeader.tsx` (+ no store changes)

## Goal

Move the app from the previous Gmail-style two-layer sidebar layout to a normal dashboard with a single collapsible icon sidebar. The sidebar refactor is already complete; this spec covers the header.

Three concrete outcomes:

1. Replace the hardcoded desktop breadcrumbs (`"Build Your Application" / "Data Fetching"`) with breadcrumbs driven by the layout store, falling back to the page title.
2. Add a dedicated **Search** control to the desktop header (icon + `⌘K` hint), wired to the existing global `CommandDialog`.
3. Add a dedicated **Add transaction** primary button to the desktop header, wired to the existing `setOpenCreateTransaction` action.

## Non-Goals

- Sidebar component changes (already done).
- Removing `leftSidebarContent` from `layout-slice` (still used by `TransactionsPage` summary panel).
- Adding `breadcrumbs` config to pages that don't have them yet — the page-title fallback covers all of those without churn.
- Changes to the mobile bottom bar.
- Adding the Add Transaction button to the mobile header (the bottom bar already has a primary `+`).

## Existing State (verified)

- `apps/web/src/features/layout/components/AppHeader.tsx` reads `pageTitle`, `headerActions`, `breadcrumbs`, `mobileBackPath`, `onMobileBack` via `useHeaderConfig()` and renders separate desktop/mobile branches. The desktop branch ignores `pageTitle` and `breadcrumbs` entirely and hardcodes the placeholder text.
- `apps/web/src/stores/slices/layout-slice.ts` already defines `Breadcrumb = { label; to? }` and `breadcrumbs: Breadcrumb[] | null`.
- Pages set page title (and sometimes breadcrumbs) via `useLayoutConfig` in `apps/web/src/features/layout/hooks/use-layout-config.ts`. Only `TransactionsPage` ever sets a multi-level breadcrumb (`Accounts › Transactions`, when account-scoped).
- `useUiActions()` already exposes `setGlobalSearch` and `setOpenCreateTransaction`. `⌘K` is wired in `apps/web/src/routes/__root.tsx` and opens the `CommandDialog` via `useGlobalSearch`.
- Backend connection state is read with `useAppStore((s) => s.backendStatus)`; the existing code already gates `handleAddTransaction` on `isBackendConnected`.

## Design

### Desktop layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [≡] │ Dashboard                          [🔍 ⌘K] [+ Add transaction] │
└─────────────────────────────────────────────────────────────────┘
```

When the active page sets explicit breadcrumbs:

```
┌─────────────────────────────────────────────────────────────────┐
│ [≡] │ Accounts › Transactions             [🔍 ⌘K] [+ Add transaction] │
└─────────────────────────────────────────────────────────────────┘
```

**Left cluster** (structure unchanged):
- `SidebarTrigger`
- vertical `Separator`
- `Breadcrumb` driven by the store

**Breadcrumb derivation** — single line of logic inside the component:

```tsx
const crumbs: Breadcrumb[] =
  breadcrumbs && breadcrumbs.length > 0
    ? breadcrumbs
    : [{ label: pageTitle }];
```

Render rules:
- Map over `crumbs`. For all but the last: `BreadcrumbLink` (with `to` if present, otherwise plain `BreadcrumbItem`); insert a `BreadcrumbSeparator` between items.
- Last crumb is always rendered as `BreadcrumbPage` (non-clickable, current page).
- For routing, `BreadcrumbLink` should use TanStack Router's `Link` via `asChild` (or equivalent existing pattern in the codebase) when `to` is set, so navigation does not full-reload.

**Right cluster** (new):

- Search button
  - shadcn `Button` with `variant="outline"`, `size="sm"`, `aria-label="Search"`
  - Content: `<SearchIcon />` plus a small kbd-styled `⌘K` hint (mirrors the current mobile look)
  - `onClick={() => setGlobalSearch(true)}`
  - `disabled={!isBackendConnected}`

- Add Transaction button
  - shadcn `Button` with `variant="default"`, `size="sm"`
  - Content: `<PlusIcon />` plus the label `"Add transaction"`
  - `onClick={handleAddTransaction}` (existing handler — already gates on `isBackendConnected`)
  - `disabled={!isBackendConnected}`

Layout uses `flex items-center gap-2` for the right cluster; the existing outer flex already has `justify-between` so left/right clusters separate naturally.

Render any page-supplied `headerActions` between the breadcrumb area and the right cluster (or alongside the right cluster) so pages like `TransactionsPage` (which sets `<TimeGrainSelect />`) keep working. Place `headerActions` to the **left** of search/add so the global controls always sit at the far right corner.

### Mobile layout

No structural change. Continue to render:
- left: optional back button + `pageTitle`
- right: page-supplied `headerActions` + existing search button

The Add Transaction button is **not** added to the mobile header (the bottom bar's primary `+` already covers this).

### Backend-disconnected behavior

Both new buttons follow the existing pattern in `AppHeader.tsx` and `AppBottombar.tsx`: read `backendStatus` via `useAppStore`, set `disabled` when not `"connected"`. The existing `handleAddTransaction` early-returns; we'll do the same for search (or simply rely on `disabled`, which already prevents `onClick`).

## Component shape (illustrative)

```tsx
const isBackendConnected = backendStatus === "connected";

const crumbs =
  breadcrumbs && breadcrumbs.length > 0 ? breadcrumbs : [{ label: pageTitle }];

const renderDesktopHeader = () => (
  <div className="hidden md:flex md:w-full md:items-center md:justify-between md:gap-2 md:px-4">
    <div className="flex min-w-0 items-center gap-2">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
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
                    <BreadcrumbLink asChild>
                      <Link to={c.to}>{c.label}</Link>
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
  </div>
);
```

(The exact JSX above is illustrative; the implementation plan will determine final styling/imports — including whether the Breadcrumb supports `asChild` already or needs a tiny wrapper.)

## Verification

Manual, since the layout feature has no existing tests:

1. **Fallback crumbs:** visit `/dashboard`, `/accounts`, `/budget`, `/net-worth`, `/goals`, `/subscriptions`, `/categories`, `/settings`. Each shows a single crumb matching its `pageTitle`. No more "Build Your Application / Data Fetching".
2. **Multi-level crumbs:** on `/transactions` filtered by an account, the desktop crumb reads `Accounts › Transactions`, and clicking `Accounts` navigates back via TanStack Router (no full reload).
3. **Search:** clicking the search button opens the existing `CommandDialog`. `⌘K` still works (already wired in `__root.tsx`).
4. **Add transaction:** clicking the button opens the existing `AddTransactionPopover` (Dialog). The `headerActions` slot (e.g. `TimeGrainSelect` on `/transactions`) still renders.
5. **Backend disconnected:** kill the API. Both new buttons render disabled; clicking them does nothing.
6. **Mobile (`< md`):** layout visually unchanged — back arrow + title on left, header actions + search on right. No new Add Transaction button.
7. **Sidebar collapse:** clicking `SidebarTrigger` collapses the sidebar to icons; header stays usable; the `group-has-data-[collapsible=icon]/sidebar-wrapper:h-12` height transition still applies.

## Risks / Open Questions

- **`BreadcrumbLink` + TanStack Router:** the shadcn `BreadcrumbLink` defaults to a plain `<a>`. If the `asChild` prop isn't already supported in `packages/ui/src/components/breadcrumb.tsx`, the implementation plan should either add `asChild` support or use the same `Link` integration pattern used elsewhere in the app (e.g. `NavMain`). This is a small, contained decision for the planning step.
- **`Fragment` import vs. wrapper element:** mapping crumbs needs a stable key per item plus a separator. Using `React.Fragment` with explicit `key` is fine; either way no DOM bloat.
