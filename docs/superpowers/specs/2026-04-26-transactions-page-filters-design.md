# Transactions Page — Desktop Filter & Search Enhancements

**Date:** 2026-04-26
**Status:** Design approved, pending implementation plan
**Owner:** Sam Waskar

---

## 1. Overview

Enhance the desktop Transactions page around three workflows — **review**, **search**, and **bulk manage** — with this spec focused on the biggest near-term gap: **search & investigate**. Introduce a first-class, URL-backed filter system (text search, multi-select categories, amount range, and preset chips) laid out fully inline on desktop. The existing mobile layout is preserved; a future mobile port is made trivial by sharing widget components and state between both containers.

Analysis/trend features are explicitly out of scope and will live on a separate dashboard page. "Review" and "bulk manage" workflows are deferred; review will be introduced alongside CSV import.

## 2. Goals

- Add powerful, ad-hoc filtering to the Transactions page for desktop
- Keep all filters visible on one screen on desktop; no popovers except where required (category multi-select)
- URL-backed filter state so views are bookmarkable, shareable, survive reload, and support deep-linking from other pages in the future
- Reuse existing shadcn primitives — no new UI library additions
- Preserve the global `DateRangeFilter` at the top of the page and the existing left-sidebar breakdowns
- Structure widgets so a future mobile container drops in without rewriting filter logic

## 3. Non-goals

- No "Needs Review" preset or schema column (deferred to CSV-import workflow)
- No saved/user-created views
- No bulk select, inline edit, or row actions beyond existing click-to-edit
- No account filter on this page (handled by account-details page)
- No analysis/trending UI
- No change to the existing breakdown sidebar
- No backward-compatibility shim for the old single `categoryId` query param

## 4. Scope

### In scope

- URL-backed filter state on the Transactions route using TanStack Router `validateSearch` + Zod
- Preset chips: **All · Uncategorized · Income · Expenses**
- Text search (description) with debounce
- Multi-select category filter
- Amount range (min / max)
- Desktop: inline layout under the DateRangeFilter
- Mobile container: search input + `Sheet`-based "Filters (n)" button containing the same widgets (design-ready; structure must accommodate it even though mobile is currently considered adequate)
- Backend API changes to accept `categoryIds` (array) and `uncategorizedOnly` (boolean)

### Out of scope

See Non-goals.

## 5. User experience

### Desktop layout (≥ lg)

Within the existing `max-w-4xl` container, stacked vertically:

1. **Row 1 — DateRangeFilter** (unchanged, global store): full content width.
2. **Row 2 — Preset chips:** `ToggleGroup` with All / Uncategorized / Income / Expenses.
3. **Row 3 — Inline filters:** search input, category multi-select trigger with inline selection pills, Min amount input, Max amount input, Reset (only visible when filters are non-default).
4. **List and sidebar:** unchanged; breakdowns stay in the left sidebar.

### Mobile layout (< lg)

1. **Row 1 — DateRangeFilter**
2. **Row 2 — Search input** + **"Filters (n)" button** + existing `TransactionsSummaryMobile` button
3. The **Filters button** opens a shadcn `Sheet` containing: PresetChips → CategoryMultiSelect → AmountRangeInputs → Reset.

### Widget behavior

- **Presets** (single-select `ToggleGroup`): clicking updates URL `preset`. "Uncategorized" is mutually exclusive with picking explicit `categoryIds` — if the user picks categories while on Uncategorized, the preset silently switches to All.
- **Search**: controlled input; local value updates immediately; URL write is **debounced 250ms**; a clear (`✕`) button inside the input resets the field.
- **Category multi-select**: shadcn `Popover` + `Command`. Trigger button shows "Category" when empty, the single name when one, or `Name +N` when many. Selected categories render as removable pills on desktop; inside the popover on mobile.
- **Amount range**: two numeric inputs. Empty = no bound. If `min > max` on blur, swap silently.
- **Reset**: visible only when any transaction-specific filter is non-default; clears all transaction filters (not DateRangeFilter).

### Filter count (for the mobile "Filters (n)" badge)

Sum of non-default filters: preset (0 if `all`, else 1) + search text presence + `categoryIds.length > 0` + min presence + max presence. DateRangeFilter is **not** counted (it's a separate global UI element).

### Empty states

- No transactions exist → existing `EmptyTransactions` component
- Transactions exist but filters match nothing → dedicated "No transactions match these filters" empty state with a **Reset filters** action
- Sidebar breakdowns when filters match zero results: show existing "No data for current filters" (or hide sections with zero totals — implementation detail)

## 6. Filter state and URL shape

TanStack Router search params validated with Zod on `apps/web/src/routes/transactions.tsx`:

```ts
const TransactionsSearchSchema = z.object({
  preset: z.enum(["all", "uncategorized", "income", "expenses"]).default("all"),
  q: z.string().optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().nonnegative().optional(),
});
```

- Defaults produce a clean URL (`/transactions`).
- URL updates use `navigate({ search: (prev) => ..., replace: true })` to avoid flooding browser history on every filter tweak.
- `DateRangeFilter` is **not** encoded in the URL — it remains on the global Zustand app-store (`useDateRange`, `useFiltersActions`) because it is shared across pages.

### URL → API mapping

| URL | API params |
|---|---|
| `preset=all` | *(no type, no uncategorizedOnly)* |
| `preset=uncategorized` | `uncategorizedOnly=true` (and `categoryIds` suppressed) |
| `preset=income` | `type=INCOME` |
| `preset=expenses` | `type=EXPENSE` |
| `q="chipotle"` | `search=chipotle` |
| `categoryIds=[a,b]` | `categoryIds=a,b` (only when preset != uncategorized) |
| `minAmount=10` | `minAmount=10` |
| `maxAmount=100` | `maxAmount=100` |
| *(always)* | `startDate`, `endDate` from global DateRangeFilter |

### Invalid URL handling

- Unknown preset value → coerce to `"all"`
- Non-UUID strings in `categoryIds` → drop invalid IDs, keep valid ones
- Negative / NaN `minAmount` / `maxAmount` → drop the bad field
- `validateSearch` produces the final, sanitized state; the page never sees invalid params

## 7. Component architecture

New folder: `apps/web/src/features/transactions/components/filters/`

```
filters/
├── TransactionFilters.tsx           # desktop container
├── TransactionFiltersSheet.tsx      # mobile container — "Filters (n)" + <Sheet>
├── use-transaction-filters.ts       # hook: URL <-> filter state, returns { filters, setFilters, resetFilters, activeFilterCount }
└── components/
    ├── PresetChips.tsx              # pure display: ToggleGroup All/Uncategorized/Income/Expenses
    ├── SearchInput.tsx              # pure display: input with clear button
    ├── CategoryMultiSelect.tsx      # pure display: Popover + Command multi-select
    ├── AmountRangeInputs.tsx        # pure display: min + max number inputs
    └── FilterResetButton.tsx        # pure display: shown when filters non-default
```

**Pure display components** (in `components/`) accept props (`value`, `onChange`, etc.) and know nothing about the URL — they are unit-testable in isolation. The **containers** (`TransactionFilters`, `TransactionFiltersSheet`) wire them to `use-transaction-filters`.

### Data flow

```
URL (TanStack Router search params)
   ↕ validateSearch(Zod)
use-transaction-filters hook       ← single source of truth
   ↓ reads                          ↑ writes
widget components                   widget components
   ↓ filters object
useTransactions({ ...dateRange, ...filters })
   ↓ fetch
API
```

### Integration into `TransactionsPage.tsx`

- Replace current header row with:
  - Row 1: `<DateRangeFilter />` full-width (unchanged component; layout tweak only)
  - Row 2 (lg+): `<TransactionFilters />`
  - Row 2 (<lg): row with `<SearchInput />` + `<TransactionFiltersSheet />` + `<TransactionsSummaryMobile />`
- Replace the local `filters` `useMemo` with the output of `useTransactionFilters()`, merged with global `dateRange` before being passed to `useTransactions`.
- Ensure `useTransactions` is configured with `placeholderData: keepPreviousData` so the list does not flicker on filter changes.

## 8. Backend changes

Changes to `apps/api/src/routes/transactions.ts` and the underlying service; corresponding updates to `packages/types`.

### Query-schema edits (`TransactionQueryRouteSchema`)

- **Remove** `categoryId` (single).
- **Add** `categoryIds`: array of UUIDs (accept repeated query params or comma-separated string; Zod coerces to `z.array(z.string().uuid())`).
- **Add** `uncategorizedOnly`: `"true" | "false"` → boolean.
- All other fields remain as today.

### Service behavior

- If `uncategorizedOnly=true` → add `isNull(transactions.categoryId)` **and** exclude transfers (`type != "TRANSFER"`), and **ignore** `categoryIds` (contradictory combo). Transfers legitimately have no category and should not appear under the "Uncategorized" preset.
- Else if `categoryIds` has entries → use `inArray(transactions.categoryId, categoryIds)`.
- Else → no category filter.

### Shared types

- Update `packages/types` `TransactionQuery` Zod schema to match: remove `categoryId`, add `categoryIds` and `uncategorizedOnly`.
- Search all existing callers of the old `categoryId` param (should be limited to the web hook and any reports code) and migrate to `categoryIds`.

### No schema migration

No new DB columns. No `needsReview` column. No change to `isCleared` semantics.

## 9. Edge cases

- **Deleted category still in URL `categoryIds`:** on mount / categories load, filter out IDs no longer present in the categories list; write cleaned version back to URL (replace mode).
- **`min > max`:** swap silently on blur.
- **Filters + DateRange produce zero results:** show dedicated empty state with Reset filters action.
- **Rapid typing in search:** 250ms debounce before URL write; `keepPreviousData` prevents flicker.
- **Preset ↔ category interaction:** selecting categories while on "Uncategorized" switches preset to "All" silently (no toast).
- **Server errors on filtered query:** existing React Query error handling applies; URL keeps filters.
- **Browser back/forward:** thanks to `replace: true`, only meaningful transitions create history entries; intra-filter tweaks do not.

## 10. Testing plan

- **Unit — `use-transaction-filters`:** preset↔category mutual exclusion, `activeFilterCount`, URL → API mapping, min/max swap, invalid param sanitation.
- **Unit — pure widgets:** `PresetChips`, `SearchInput`, `CategoryMultiSelect`, `AmountRangeInputs`, `FilterResetButton` render states and callbacks.
- **Integration:** filter → URL → reload → state persists; category deletion cleans URL; preset change clears category selections when appropriate.
- **Visual (desktop):** all filters visible inline; Reset appears/disappears; list and sidebar do not regress.
- **Visual (mobile):** Filters (n) badge counts correctly; Sheet opens with identical widgets; `DateRangeFilter` remains at top.
- **Manual:** browser back/forward after 4+ filter changes behaves sensibly; shareable URLs render the exact filtered view on a fresh load.

## 11. Risks and open considerations

- **Category param refactor fallout:** `categoryId` may be referenced beyond the transactions hook — e.g., reports endpoints or tests. The implementation plan must grep for all callers and migrate them together.
- **DateRangeFilter still global:** keeping it out of the URL means a shared link won't reproduce the date range unless we encode it separately. Accepted for v1; a future enhancement can sync it.
- **Uncategorized preset semantics:** decided — transfers are excluded (see §8 service behavior). "Uncategorized" targets INCOME/EXPENSE rows with a null `categoryId`. Revisit only if users flag transfers missing from the view as surprising.

## 12. Summary of deliverables

1. New folder `apps/web/src/features/transactions/components/filters/` with containers, hook, and `components/` sub-folder for pure display widgets.
2. Updates to `apps/web/src/routes/transactions.tsx` adding `validateSearch`.
3. Updates to `TransactionsPage.tsx` to use `useTransactionFilters`, render new layout, and pass merged filters to `useTransactions`.
4. Updates to `apps/api/src/routes/transactions.ts` and its service: replace `categoryId` with `categoryIds`, add `uncategorizedOnly`.
5. Updates to `packages/types` `TransactionQuery`.
6. Migration of any other callers using the old `categoryId` single param.
7. Unit, integration, and visual tests per §10.
