# Transactions Page URL-Backed Filters — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add URL-backed filters (preset, search, multi-category, amount range) to the Transactions page — fully inline on desktop, `Sheet`-based on mobile — while migrating the backend from a single `categoryId` query param to `categoryIds` + `uncategorizedOnly`.

**Architecture:** Filter state lives in the TanStack Router URL (`validateSearch` + Zod). A single `useTransactionFilters` hook is the source of truth; pure display widgets (`PresetChips`, `SearchInput`, `CategoryMultiSelect`, `AmountRangeInputs`, `FilterResetButton`) are wired by two containers (`TransactionFilters` for desktop, `TransactionFiltersSheet` for mobile). Backend `listTransactions` gains `categoryIds` (in-array) and `uncategorizedOnly` (null + non-transfer) filters.

**Tech Stack:** TypeScript, Zod v4, TanStack Router v1 `validateSearch`, TanStack React Query (`keepPreviousData`), Drizzle ORM, Hono + zod-openapi, shadcn/ui (`ToggleGroup`, `Popover`, `Command`, `Sheet`, `Input`, `Button`), Vitest (API + new minimal web config).

**Spec reference:** `docs/superpowers/specs/2026-04-26-transactions-page-filters-design.md`

**Pre-existing in-flight change:** `apps/web/src/features/transactions/components/transactions-page/TransactionItem.tsx` and `TransactionsPage.tsx` have uncommitted modifications at plan start (layout tweak). **Do not revert or discard them.** Modifications from this plan to `TransactionsPage.tsx` build on top of that working tree.

---

## File Structure

### Backend (modified)

- `packages/types/src/schema.ts` — `TransactionQuerySchema`: drop `categoryId`, add `categoryIds: z.array(z.uuid()).optional()` and `uncategorizedOnly: z.boolean().optional()`.
- `apps/api/src/routes/transactions.ts` — `TransactionQueryRouteSchema`: match the above, with string→array coercion for HTTP query params.
- `apps/api/src/services/transactions.service.ts` — `listTransactions`: replace single-category filter with multi + uncategorized logic.
- `apps/api/src/services/transactions.service.test.ts` *(NEW)* — service unit tests.

### Frontend (new)

- `apps/web/vitest.config.ts` *(NEW)* — minimal node-env Vitest config for pure utility tests.
- `apps/web/src/features/transactions/components/filters/filter-types.ts` *(NEW)* — `TransactionFilterState`, `TransactionFilterPreset` types + default state constants.
- `apps/web/src/features/transactions/components/filters/filter-utils.ts` *(NEW)* — pure helpers: `toApiQuery`, `getActiveFilterCount`, `sanitizeCategoryIds`, `swapIfInverted`.
- `apps/web/src/features/transactions/components/filters/filter-utils.test.ts` *(NEW)* — unit tests for the helpers.
- `apps/web/src/features/transactions/components/filters/use-transaction-filters.ts` *(NEW)* — hook wrapping TanStack Router `useSearch` / `useNavigate`.
- `apps/web/src/features/transactions/components/filters/components/PresetChips.tsx` *(NEW)*
- `apps/web/src/features/transactions/components/filters/components/SearchInput.tsx` *(NEW)*
- `apps/web/src/features/transactions/components/filters/components/CategoryMultiSelect.tsx` *(NEW)*
- `apps/web/src/features/transactions/components/filters/components/AmountRangeInputs.tsx` *(NEW)*
- `apps/web/src/features/transactions/components/filters/components/FilterResetButton.tsx` *(NEW)*
- `apps/web/src/features/transactions/components/filters/TransactionFilters.tsx` *(NEW)* — desktop container.
- `apps/web/src/features/transactions/components/filters/TransactionFiltersSheet.tsx` *(NEW)* — mobile container.
- `apps/web/src/features/transactions/components/filters/index.ts` *(NEW)* — feature barrel.
- `apps/web/src/features/transactions/components/transactions-page/FilteredEmpty.tsx` *(NEW)* — "no transactions match these filters" empty state with a Reset action.

### Frontend (modified)

- `apps/web/src/routes/transactions.tsx` — add `validateSearch: TransactionsSearchSchema`.
- `apps/web/src/features/transactions/components/transactions-page/TransactionsPage.tsx` — use `useTransactionFilters`, render new desktop/mobile filter rows, pass merged filters to `useTransactions`, switch empty state between `EmptyTransactions` and `FilteredEmpty`.
- `apps/web/src/features/transactions/api/use-transactions.ts` — add `placeholderData: keepPreviousData`.
- `apps/web/package.json` — add `vitest` + `test` / `test:watch` scripts.

---

## Task 1: Update shared `TransactionQuerySchema` in `packages/types`

**Files:**
- Modify: `packages/types/src/schema.ts` (lines 432–448)

- [ ] **Step 1: Read the current schema to confirm the lines to replace**

Run: `grep -n "TransactionQuerySchema" packages/types/src/schema.ts`
Expected: shows lines 432–448 bracketing `TransactionQuerySchema` and its type export.

- [ ] **Step 2: Replace the schema**

Replace the block `export const TransactionQuerySchema = z.object({ ... });` (lines 432–446) and its type export with:

```ts
export const TransactionQuerySchema = z.object({
  accountId: z.uuid().optional(),
  categoryIds: z.array(z.uuid()).optional(),
  uncategorizedOnly: z.boolean().optional(),
  type: TransactionTypeSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
  isCleared: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(["date", "amount", "description"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type TransactionQuery = z.input<typeof TransactionQuerySchema>;
```

- [ ] **Step 3: Type-check the types package**

Run: `pnpm --filter=@workspace/types typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/types/src/schema.ts
git commit -m "feat(types): switch TransactionQuery to categoryIds + uncategorizedOnly"
```

---

## Task 2: Update API route schema in `apps/api/src/routes/transactions.ts`

**Files:**
- Modify: `apps/api/src/routes/transactions.ts` (lines 27–41)

- [ ] **Step 1: Replace `TransactionQueryRouteSchema`**

Replace the `TransactionQueryRouteSchema = z.object({ ... });` block (lines 27–41) with:

```ts
const TransactionQueryRouteSchema = z.object({
  accountId: z.string().uuid().optional(),
  categoryIds: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v.split(",")))
    .pipe(z.array(z.string().uuid()))
    .optional(),
  uncategorizedOnly: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]).optional(),
  startDate: z.string().optional().openapi({ example: "2026-01-01" }),
  endDate: z.string().optional().openapi({ example: "2026-12-31" }),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
  isCleared: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  search: z.string().optional(),
  limit: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().min(1).max(100))
    .optional(),
  offset: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().min(0))
    .optional(),
  sortBy: z.enum(["date", "amount", "description"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
```

*(The 1:1 removal of the old `categoryId: z.string().uuid().optional()` line is what matters — `CreateTransactionBodySchema` and `UpdateTransactionBodySchema` at lines 52 and 84 keep their `categoryId` property for the create/update payloads, which is unrelated.)*

- [ ] **Step 2: Type-check the api**

Run: `pnpm --filter=api typecheck`
Expected: FAIL — `transactions.service.ts` still references `filters.categoryId`. That is fixed in Task 3. Proceed to Task 3 without committing if typecheck fails; otherwise commit.

*(If typecheck happens to pass because tsc does not flag unused conditionals, commit this task before moving on.)*

- [ ] **Step 3: Commit (only if typecheck passes)**

```bash
git add apps/api/src/routes/transactions.ts
git commit -m "feat(api): accept categoryIds and uncategorizedOnly on transactions query"
```

---

## Task 3: Update `listTransactions` service logic (TDD)

**Files:**
- Create: `apps/api/src/services/transactions.service.test.ts`
- Modify: `apps/api/src/services/transactions.service.ts` (lines 30–65, the filters block)

- [ ] **Step 1: Write failing tests for the new filter shape**

Create `apps/api/src/services/transactions.service.test.ts`:

```ts
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../libs/db.js";
import { profiles, accounts, transactions } from "@workspace/db";
import { TransactionsService } from "./transactions.service.js";

const service = new TransactionsService();

const PROFILE_ID = "00000000-0000-0000-0000-000000000001";
const ACCOUNT_ID = "00000000-0000-0000-0000-000000000101";
const CAT_A = "00000000-0000-0000-0000-0000000000aa";
const CAT_B = "00000000-0000-0000-0000-0000000000bb";

async function clear() {
  await db.delete(transactions);
  await db.delete(accounts);
  await db.delete(profiles);
}

async function seed() {
  await db.insert(profiles).values({
    id: PROFILE_ID,
    name: "Test",
    type: "PERSONAL",
  });
  await db.insert(accounts).values({
    id: ACCOUNT_ID,
    profileId: PROFILE_ID,
    name: "Checking",
    type: "CHECKING",
    currency: "USD",
  });
  await db.insert(transactions).values([
    {
      id: "10000000-0000-0000-0000-000000000001",
      profileId: PROFILE_ID,
      accountId: ACCOUNT_ID,
      categoryId: CAT_A,
      type: "EXPENSE",
      amount: "10.00",
      description: "cat-a expense",
      date: "2026-04-10",
    },
    {
      id: "10000000-0000-0000-0000-000000000002",
      profileId: PROFILE_ID,
      accountId: ACCOUNT_ID,
      categoryId: CAT_B,
      type: "EXPENSE",
      amount: "20.00",
      description: "cat-b expense",
      date: "2026-04-11",
    },
    {
      id: "10000000-0000-0000-0000-000000000003",
      profileId: PROFILE_ID,
      accountId: ACCOUNT_ID,
      categoryId: null,
      type: "EXPENSE",
      amount: "30.00",
      description: "uncategorized expense",
      date: "2026-04-12",
    },
    {
      id: "10000000-0000-0000-0000-000000000004",
      profileId: PROFILE_ID,
      accountId: ACCOUNT_ID,
      categoryId: null,
      type: "TRANSFER",
      amount: "40.00",
      description: "transfer leg",
      date: "2026-04-13",
    },
  ]);
}

beforeAll(async () => {
  await clear();
  await seed();
});

afterAll(async () => {
  await clear();
});

describe("listTransactions — filters", () => {
  it("filters by a single category via categoryIds", async () => {
    const { transactions: rows } = await service.listTransactions(PROFILE_ID, {
      categoryIds: [CAT_A],
    });
    const descs = rows.map((r) => r.description);
    expect(descs).toEqual(["cat-a expense"]);
  });

  it("filters by multiple categories via categoryIds", async () => {
    const { transactions: rows } = await service.listTransactions(PROFILE_ID, {
      categoryIds: [CAT_A, CAT_B],
    });
    const descs = rows.map((r) => r.description).sort();
    expect(descs).toEqual(["cat-a expense", "cat-b expense"]);
  });

  it("uncategorizedOnly=true returns only null-category non-transfers", async () => {
    const { transactions: rows } = await service.listTransactions(PROFILE_ID, {
      uncategorizedOnly: true,
    });
    const descs = rows.map((r) => r.description);
    expect(descs).toEqual(["uncategorized expense"]);
  });

  it("uncategorizedOnly=true ignores categoryIds when both are provided", async () => {
    const { transactions: rows } = await service.listTransactions(PROFILE_ID, {
      uncategorizedOnly: true,
      categoryIds: [CAT_A],
    });
    const descs = rows.map((r) => r.description);
    expect(descs).toEqual(["uncategorized expense"]);
  });
});
```

- [ ] **Step 2: Run the new tests — expect failure**

Run: `pnpm --filter=api test -- transactions.service`
Expected: FAIL — `listTransactions` still references `filters?.categoryId`, and `filters.categoryIds`/`filters.uncategorizedOnly` are ignored. The "filters by a single category via categoryIds" test is the clearest failure.

- [ ] **Step 3: Update the service**

In `apps/api/src/services/transactions.service.ts`, replace the block that begins on line 38:

```ts
    if (filters?.categoryId) {
      conditions.push(eq(transactions.categoryId, filters.categoryId));
    }
```

with:

```ts
    if (filters?.uncategorizedOnly) {
      conditions.push(isNull(transactions.categoryId));
      conditions.push(ne(transactions.type, "TRANSFER"));
    } else if (filters?.categoryIds && filters.categoryIds.length > 0) {
      conditions.push(inArray(transactions.categoryId, filters.categoryIds));
    }
```

Then update the import of Drizzle helpers near the top of the file (currently `from "../libs/db.js"`) to include `inArray`, `isNull`, and `ne`:

```ts
import { and, asc, db, desc, eq, gte, inArray, isNull, lte, ne, or, sql } from "../libs/db.js";
```

If `apps/api/src/libs/db.js` does not re-export `inArray`, `isNull`, or `ne`, import them directly from `drizzle-orm` instead:

```ts
import { inArray, isNull, ne } from "drizzle-orm";
import { and, asc, db, desc, eq, gte, lte, or, sql } from "../libs/db.js";
```

- [ ] **Step 4: Run the service tests — expect PASS**

Run: `pnpm --filter=api test -- transactions.service`
Expected: PASS (all four tests).

- [ ] **Step 5: Full API typecheck + full API test suite**

Run: `pnpm --filter=api typecheck && pnpm --filter=api test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/services/transactions.service.ts apps/api/src/services/transactions.service.test.ts apps/api/src/routes/transactions.ts
git commit -m "feat(api): support categoryIds and uncategorizedOnly in listTransactions"
```

---

## Task 4: Set up minimal Vitest in `apps/web`

**Files:**
- Create: `apps/web/vitest.config.ts`
- Modify: `apps/web/package.json` (scripts + devDependencies)

- [ ] **Step 1: Add vitest to web devDependencies**

```bash
pnpm --filter=web add -D vitest@^3.2.4
```

- [ ] **Step 2: Create `apps/web/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.test.ts"],
    watch: false,
  },
});
```

- [ ] **Step 3: Add `test` scripts to `apps/web/package.json`**

In the `scripts` block, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Sanity-check the setup with a throwaway test**

Create `apps/web/src/__smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("vitest smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `pnpm --filter=web test`
Expected: PASS (1 test).

- [ ] **Step 5: Remove the smoke test and commit**

```bash
rm apps/web/src/__smoke.test.ts
git add apps/web/package.json apps/web/vitest.config.ts pnpm-lock.yaml
git commit -m "chore(web): add minimal vitest setup for pure utility tests"
```

---

## Task 5: Create `filter-types.ts` and `TransactionsSearchSchema` (route `validateSearch`)

**Files:**
- Create: `apps/web/src/features/transactions/components/filters/filter-types.ts`
- Modify: `apps/web/src/routes/transactions.tsx`

- [ ] **Step 1: Create `filter-types.ts`**

```ts
import { z } from "zod/v4";

export const TRANSACTION_FILTER_PRESETS = [
  "all",
  "uncategorized",
  "income",
  "expenses",
] as const;

export type TransactionFilterPreset =
  (typeof TRANSACTION_FILTER_PRESETS)[number];

export const TransactionsSearchSchema = z.object({
  preset: z.enum(TRANSACTION_FILTER_PRESETS).catch("all").default("all"),
  q: z.string().optional().catch(undefined),
  categoryIds: z.array(z.uuid()).optional().catch(undefined),
  minAmount: z.number().nonnegative().optional().catch(undefined),
  maxAmount: z.number().nonnegative().optional().catch(undefined),
});

export type TransactionFilterState = z.infer<typeof TransactionsSearchSchema>;

export const DEFAULT_TRANSACTION_FILTERS: TransactionFilterState = {
  preset: "all",
};
```

- [ ] **Step 2: Wire `validateSearch` into `routes/transactions.tsx`**

Replace `apps/web/src/routes/transactions.tsx` with:

```tsx
import { TRANSACTIONS_ROUTE } from "@/constants";
import { RequiresProfile } from "@/components/RouteGuards";
import { TransactionsPage } from "@/features/transactions";
import { TransactionsSearchSchema } from "@/features/transactions/components/filters/filter-types";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(TRANSACTIONS_ROUTE)({
  component: TransactionsRoute,
  validateSearch: TransactionsSearchSchema,
});

function TransactionsRoute() {
  return (
    <RequiresProfile>
      <TransactionsPage />
    </RequiresProfile>
  );
}
```

- [ ] **Step 3: Typecheck the web app**

Run: `pnpm --filter=web typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/transactions/components/filters/filter-types.ts apps/web/src/routes/transactions.tsx
git commit -m "feat(web): add URL search schema for transactions filters"
```

---

## Task 6: Create `filter-utils.ts` with tests (TDD)

**Files:**
- Create: `apps/web/src/features/transactions/components/filters/filter-utils.ts`
- Create: `apps/web/src/features/transactions/components/filters/filter-utils.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `filter-utils.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  getActiveFilterCount,
  sanitizeCategoryIds,
  swapIfInverted,
  toApiQuery,
} from "./filter-utils";
import type { TransactionFilterState } from "./filter-types";

const BASE: TransactionFilterState = { preset: "all" };

describe("getActiveFilterCount", () => {
  it("returns 0 for defaults", () => {
    expect(getActiveFilterCount(BASE)).toBe(0);
  });

  it("counts each non-default filter exactly once", () => {
    expect(
      getActiveFilterCount({
        preset: "uncategorized",
        q: "chipotle",
        categoryIds: ["id-1"],
        minAmount: 10,
        maxAmount: 100,
      })
    ).toBe(5);
  });

  it("does not count empty search string", () => {
    expect(getActiveFilterCount({ preset: "all", q: "" })).toBe(0);
  });

  it("does not count empty categoryIds array", () => {
    expect(getActiveFilterCount({ preset: "all", categoryIds: [] })).toBe(0);
  });
});

describe("toApiQuery", () => {
  const range = { startDate: "2026-04-01", endDate: "2026-04-30" };

  it("maps preset=all to no type / no uncategorizedOnly", () => {
    const q = toApiQuery({ preset: "all" }, range);
    expect(q.type).toBeUndefined();
    expect(q.uncategorizedOnly).toBeUndefined();
    expect(q.startDate).toBe("2026-04-01");
    expect(q.endDate).toBe("2026-04-30");
  });

  it("maps preset=uncategorized to uncategorizedOnly=true and drops categoryIds", () => {
    const q = toApiQuery(
      { preset: "uncategorized", categoryIds: ["id-1"] },
      range
    );
    expect(q.uncategorizedOnly).toBe(true);
    expect(q.categoryIds).toBeUndefined();
  });

  it("maps preset=income to type=INCOME", () => {
    expect(toApiQuery({ preset: "income" }, range).type).toBe("INCOME");
  });

  it("maps preset=expenses to type=EXPENSE", () => {
    expect(toApiQuery({ preset: "expenses" }, range).type).toBe("EXPENSE");
  });

  it("passes q as search, and amount fields as strings", () => {
    const q = toApiQuery(
      { preset: "all", q: "chipotle", minAmount: 10, maxAmount: 100 },
      range
    );
    expect(q.search).toBe("chipotle");
    expect(q.minAmount).toBe("10");
    expect(q.maxAmount).toBe("100");
  });

  it("passes categoryIds when preset is not uncategorized", () => {
    const q = toApiQuery(
      { preset: "all", categoryIds: ["a", "b"] },
      range
    );
    expect(q.categoryIds).toEqual(["a", "b"]);
  });
});

describe("sanitizeCategoryIds", () => {
  it("keeps only ids that exist in the known set", () => {
    expect(sanitizeCategoryIds(["a", "b", "c"], new Set(["a", "c"]))).toEqual([
      "a",
      "c",
    ]);
  });

  it("returns undefined when input is undefined or empty", () => {
    expect(sanitizeCategoryIds(undefined, new Set(["a"]))).toBeUndefined();
    expect(sanitizeCategoryIds([], new Set(["a"]))).toBeUndefined();
  });

  it("returns undefined when all ids are unknown", () => {
    expect(sanitizeCategoryIds(["x", "y"], new Set(["a"]))).toBeUndefined();
  });
});

describe("swapIfInverted", () => {
  it("swaps when min > max", () => {
    expect(swapIfInverted(50, 10)).toEqual({ min: 10, max: 50 });
  });

  it("leaves values alone when in order", () => {
    expect(swapIfInverted(10, 50)).toEqual({ min: 10, max: 50 });
  });

  it("no-ops when either side is undefined", () => {
    expect(swapIfInverted(undefined, 50)).toEqual({ min: undefined, max: 50 });
    expect(swapIfInverted(10, undefined)).toEqual({ min: 10, max: undefined });
  });
});
```

- [ ] **Step 2: Run the tests — expect failure**

Run: `pnpm --filter=web test`
Expected: FAIL — `filter-utils` module does not exist.

- [ ] **Step 3: Implement `filter-utils.ts`**

Create `apps/web/src/features/transactions/components/filters/filter-utils.ts`:

```ts
import type { TransactionQuery } from "@workspace/types";
import type { TransactionFilterState } from "./filter-types";

export function getActiveFilterCount(state: TransactionFilterState): number {
  let count = 0;
  if (state.preset !== "all") count += 1;
  if (state.q && state.q.length > 0) count += 1;
  if (state.categoryIds && state.categoryIds.length > 0) count += 1;
  if (state.minAmount !== undefined) count += 1;
  if (state.maxAmount !== undefined) count += 1;
  return count;
}

export function toApiQuery(
  state: TransactionFilterState,
  range: { startDate: string; endDate: string }
): TransactionQuery {
  const base: TransactionQuery = {
    startDate: range.startDate,
    endDate: range.endDate,
  };

  if (state.preset === "uncategorized") {
    base.uncategorizedOnly = true;
  } else if (state.preset === "income") {
    base.type = "INCOME";
  } else if (state.preset === "expenses") {
    base.type = "EXPENSE";
  }

  if (state.preset !== "uncategorized" && state.categoryIds?.length) {
    base.categoryIds = state.categoryIds;
  }

  if (state.q && state.q.trim().length > 0) {
    base.search = state.q;
  }

  if (state.minAmount !== undefined) {
    base.minAmount = String(state.minAmount);
  }
  if (state.maxAmount !== undefined) {
    base.maxAmount = String(state.maxAmount);
  }

  return base;
}

export function sanitizeCategoryIds(
  ids: string[] | undefined,
  known: Set<string>
): string[] | undefined {
  if (!ids || ids.length === 0) return undefined;
  const kept = ids.filter((id) => known.has(id));
  return kept.length > 0 ? kept : undefined;
}

export function swapIfInverted(
  min: number | undefined,
  max: number | undefined
): { min: number | undefined; max: number | undefined } {
  if (min !== undefined && max !== undefined && min > max) {
    return { min: max, max: min };
  }
  return { min, max };
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `pnpm --filter=web test`
Expected: PASS (all test blocks).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/transactions/components/filters/filter-utils.ts apps/web/src/features/transactions/components/filters/filter-utils.test.ts
git commit -m "feat(web): add pure filter utilities with tests"
```

---

## Task 7: Create `use-transaction-filters` hook

**Files:**
- Create: `apps/web/src/features/transactions/components/filters/use-transaction-filters.ts`

- [ ] **Step 1: Implement the hook**

```ts
import { useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type {
  TransactionFilterPreset,
  TransactionFilterState,
} from "./filter-types";
import { DEFAULT_TRANSACTION_FILTERS } from "./filter-types";
import { getActiveFilterCount, swapIfInverted } from "./filter-utils";

type Patch = Partial<TransactionFilterState>;

function stripDefaults(
  next: TransactionFilterState
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (next.preset !== "all") out.preset = next.preset;
  if (next.q && next.q.length > 0) out.q = next.q;
  if (next.categoryIds && next.categoryIds.length > 0)
    out.categoryIds = next.categoryIds;
  if (next.minAmount !== undefined) out.minAmount = next.minAmount;
  if (next.maxAmount !== undefined) out.maxAmount = next.maxAmount;
  return out;
}

export function useTransactionFilters() {
  const filters = useSearch({ strict: false }) as TransactionFilterState;
  const navigate = useNavigate();

  const setFilters = useCallback(
    (patch: Patch) => {
      const merged: TransactionFilterState = {
        ...DEFAULT_TRANSACTION_FILTERS,
        ...filters,
        ...patch,
      };

      // Preset ↔ category mutual exclusion
      if (
        merged.preset === "uncategorized" &&
        patch.categoryIds &&
        patch.categoryIds.length > 0
      ) {
        merged.preset = "all";
      }

      if (
        merged.preset === "uncategorized" &&
        merged.categoryIds &&
        merged.categoryIds.length > 0 &&
        patch.preset !== "uncategorized"
      ) {
        // no-op placeholder — handled above
      }

      // Amount invariant
      const { min, max } = swapIfInverted(merged.minAmount, merged.maxAmount);
      merged.minAmount = min;
      merged.maxAmount = max;

      void navigate({
        search: () => stripDefaults(merged),
        replace: true,
      });
    },
    [filters, navigate]
  );

  const resetFilters = useCallback(() => {
    void navigate({
      search: () => ({}),
      replace: true,
    });
  }, [navigate]);

  const setPreset = useCallback(
    (preset: TransactionFilterPreset) => setFilters({ preset }),
    [setFilters]
  );

  return {
    filters,
    setFilters,
    setPreset,
    resetFilters,
    activeFilterCount: getActiveFilterCount(filters),
  };
}
```

- [ ] **Step 2: Typecheck web**

Run: `pnpm --filter=web typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/transactions/components/filters/use-transaction-filters.ts
git commit -m "feat(web): useTransactionFilters hook backing URL state"
```

---

## Task 8: `PresetChips` pure display component

**Files:**
- Create: `apps/web/src/features/transactions/components/filters/components/PresetChips.tsx`

- [ ] **Step 1: Implement**

```tsx
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import type { TransactionFilterPreset } from "../filter-types";

const PRESETS: Array<{ value: TransactionFilterPreset; label: string }> = [
  { value: "all", label: "All" },
  { value: "uncategorized", label: "Uncategorized" },
  { value: "income", label: "Income" },
  { value: "expenses", label: "Expenses" },
];

export interface PresetChipsProps {
  value: TransactionFilterPreset;
  onChange: (next: TransactionFilterPreset) => void;
}

export function PresetChips({ value, onChange }: PresetChipsProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        if (!next) return;
        onChange(next as TransactionFilterPreset);
      }}
      className="flex flex-wrap gap-1"
    >
      {PRESETS.map((p) => (
        <ToggleGroupItem key={p.value} value={p.value} className="text-xs">
          {p.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter=web typecheck`
Expected: PASS. If `ToggleGroupItem` doesn't exist, run `grep -n "export" packages/ui/src/components/toggle-group.tsx` and use the actual exported names (e.g., `ToggleGroup` + `Toggle`) — keep the API identical (single-select, `value`/`onValueChange`).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/transactions/components/filters/components/PresetChips.tsx
git commit -m "feat(web): PresetChips display component"
```

---

## Task 9: `SearchInput` pure display component (with debounce)

**Files:**
- Create: `apps/web/src/features/transactions/components/filters/components/SearchInput.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useEffect, useRef, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";

export interface SearchInputProps {
  value: string;
  onDebouncedChange: (next: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  value,
  onDebouncedChange,
  placeholder = "Search description…",
  debounceMs = 250,
  className,
}: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (local === value) return;
    timer.current = setTimeout(() => onDebouncedChange(local), debounceMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [local, value, debounceMs, onDebouncedChange]);

  return (
    <div className={`relative flex items-center ${className ?? ""}`}>
      <SearchIcon className="pointer-events-none absolute left-2 size-3.5 text-muted-foreground" />
      <Input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="h-8 pl-7 pr-7 text-xs"
      />
      {local.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 size-6"
          aria-label="Clear search"
          onClick={() => {
            setLocal("");
            onDebouncedChange("");
          }}
        >
          <XIcon className="size-3" />
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter=web typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/transactions/components/filters/components/SearchInput.tsx
git commit -m "feat(web): SearchInput display component with debounce"
```

---

## Task 10: `CategoryMultiSelect` pure display component

**Files:**
- Create: `apps/web/src/features/transactions/components/filters/components/CategoryMultiSelect.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useState } from "react";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";

export interface CategoryOption {
  id: string;
  name: string;
  icon?: string;
  parentId?: string | null;
}

export interface CategoryMultiSelectProps {
  options: CategoryOption[];
  value: string[];
  onChange: (next: string[]) => void;
  /** Render selected categories as inline removable pills next to the trigger (desktop) */
  showInlinePills?: boolean;
}

export function CategoryMultiSelect({
  options,
  value,
  onChange,
  showInlinePills = true,
}: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.filter((o) => value.includes(o.id));
  const triggerLabel =
    selected.length === 0
      ? "Category"
      : selected.length === 1
        ? (selected[0]?.name ?? "Category")
        : `${selected[0]?.name} +${selected.length - 1}`;

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
          >
            {triggerLabel}
            <ChevronDownIcon className="size-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search categories…" className="h-8 text-xs" />
            <CommandList>
              <CommandEmpty>No categories.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => {
                  const isChecked = value.includes(opt.id);
                  return (
                    <CommandItem
                      key={opt.id}
                      value={opt.name}
                      onSelect={() => toggle(opt.id)}
                      className="text-xs"
                    >
                      <CheckIcon
                        className={`mr-2 size-3 ${
                          isChecked ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      {opt.icon ? `${opt.icon} ` : ""}
                      {opt.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {showInlinePills &&
        selected.map((cat) => (
          <Badge
            key={cat.id}
            variant="secondary"
            className="h-6 gap-1 rounded-full px-2 text-[10px]"
          >
            {cat.name}
            <button
              type="button"
              onClick={() => toggle(cat.id)}
              aria-label={`Remove ${cat.name}`}
              className="-mr-1 rounded hover:bg-muted"
            >
              <XIcon className="size-3" />
            </button>
          </Badge>
        ))}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter=web typecheck`
Expected: PASS. If `CommandInput`/`CommandEmpty` exports differ from the names above, run `grep -n "export" packages/ui/src/components/command.tsx` and substitute. Keep the usage pattern the same.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/transactions/components/filters/components/CategoryMultiSelect.tsx
git commit -m "feat(web): CategoryMultiSelect display component"
```

---

## Task 11: `AmountRangeInputs` pure display component

**Files:**
- Create: `apps/web/src/features/transactions/components/filters/components/AmountRangeInputs.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useEffect, useState } from "react";
import { Input } from "@workspace/ui/components/input";

export interface AmountRangeInputsProps {
  min: number | undefined;
  max: number | undefined;
  onCommit: (next: { min: number | undefined; max: number | undefined }) => void;
  className?: string;
}

function parseOptionalNumber(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

export function AmountRangeInputs({
  min,
  max,
  onCommit,
  className,
}: AmountRangeInputsProps) {
  const [minLocal, setMinLocal] = useState(min !== undefined ? String(min) : "");
  const [maxLocal, setMaxLocal] = useState(max !== undefined ? String(max) : "");

  useEffect(() => {
    setMinLocal(min !== undefined ? String(min) : "");
  }, [min]);
  useEffect(() => {
    setMaxLocal(max !== undefined ? String(max) : "");
  }, [max]);

  const commit = () => {
    onCommit({
      min: parseOptionalNumber(minLocal),
      max: parseOptionalNumber(maxLocal),
    });
  };

  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        value={minLocal}
        onChange={(e) => setMinLocal(e.target.value)}
        onBlur={commit}
        placeholder="Min $"
        aria-label="Minimum amount"
        className="h-8 w-20 text-xs"
      />
      <span className="text-xs text-muted-foreground">–</span>
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        value={maxLocal}
        onChange={(e) => setMaxLocal(e.target.value)}
        onBlur={commit}
        placeholder="Max $"
        aria-label="Maximum amount"
        className="h-8 w-20 text-xs"
      />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter=web typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/transactions/components/filters/components/AmountRangeInputs.tsx
git commit -m "feat(web): AmountRangeInputs display component"
```

---

## Task 12: `FilterResetButton` pure display component

**Files:**
- Create: `apps/web/src/features/transactions/components/filters/components/FilterResetButton.tsx`

- [ ] **Step 1: Implement**

```tsx
import { XIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

export interface FilterResetButtonProps {
  visible: boolean;
  onReset: () => void;
  className?: string;
}

export function FilterResetButton({
  visible,
  onReset,
  className,
}: FilterResetButtonProps) {
  if (!visible) return null;
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onReset}
      className={`h-8 gap-1 text-xs text-muted-foreground ${className ?? ""}`}
    >
      <XIcon className="size-3" />
      Reset
    </Button>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `pnpm --filter=web typecheck`
Expected: PASS.

```bash
git add apps/web/src/features/transactions/components/filters/components/FilterResetButton.tsx
git commit -m "feat(web): FilterResetButton display component"
```

---

## Task 13: `TransactionFilters` desktop container

**Files:**
- Create: `apps/web/src/features/transactions/components/filters/TransactionFilters.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useEffect, useMemo } from "react";
import { useCategories } from "@/features/categories/api/use-categories";
import { PresetChips } from "./components/PresetChips";
import { SearchInput } from "./components/SearchInput";
import { CategoryMultiSelect } from "./components/CategoryMultiSelect";
import type { CategoryOption } from "./components/CategoryMultiSelect";
import { AmountRangeInputs } from "./components/AmountRangeInputs";
import { FilterResetButton } from "./components/FilterResetButton";
import { useTransactionFilters } from "./use-transaction-filters";
import { sanitizeCategoryIds } from "./filter-utils";

export function TransactionFilters() {
  const { data: categories } = useCategories();
  const { filters, setFilters, resetFilters, activeFilterCount } =
    useTransactionFilters();

  const options: CategoryOption[] = useMemo(
    () =>
      (categories ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon ?? undefined,
        parentId: c.parentId ?? null,
      })),
    [categories]
  );

  // Clean stale category IDs once categories load
  useEffect(() => {
    if (!categories || !filters.categoryIds) return;
    const known = new Set(categories.map((c) => c.id));
    const cleaned = sanitizeCategoryIds(filters.categoryIds, known);
    if (
      (cleaned?.length ?? 0) !== (filters.categoryIds?.length ?? 0)
    ) {
      setFilters({ categoryIds: cleaned });
    }
  }, [categories, filters.categoryIds, setFilters]);

  return (
    <div className="flex flex-col gap-2">
      <PresetChips
        value={filters.preset}
        onChange={(preset) => setFilters({ preset })}
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={filters.q ?? ""}
          onDebouncedChange={(next) =>
            setFilters({ q: next.length > 0 ? next : undefined })
          }
          className="min-w-[220px] flex-1"
        />

        <CategoryMultiSelect
          options={options}
          value={filters.categoryIds ?? []}
          onChange={(next) =>
            setFilters({ categoryIds: next.length > 0 ? next : undefined })
          }
        />

        <AmountRangeInputs
          min={filters.minAmount}
          max={filters.maxAmount}
          onCommit={({ min, max }) =>
            setFilters({ minAmount: min, maxAmount: max })
          }
        />

        <FilterResetButton
          visible={activeFilterCount > 0}
          onReset={resetFilters}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `pnpm --filter=web typecheck`
Expected: PASS.

```bash
git add apps/web/src/features/transactions/components/filters/TransactionFilters.tsx
git commit -m "feat(web): TransactionFilters desktop container"
```

---

## Task 14: `TransactionFiltersSheet` mobile container

**Files:**
- Create: `apps/web/src/features/transactions/components/filters/TransactionFiltersSheet.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { useCategories } from "@/features/categories/api/use-categories";
import { PresetChips } from "./components/PresetChips";
import { CategoryMultiSelect } from "./components/CategoryMultiSelect";
import type { CategoryOption } from "./components/CategoryMultiSelect";
import { AmountRangeInputs } from "./components/AmountRangeInputs";
import { FilterResetButton } from "./components/FilterResetButton";
import { useTransactionFilters } from "./use-transaction-filters";
import { sanitizeCategoryIds } from "./filter-utils";

export function TransactionFiltersSheet() {
  const [open, setOpen] = useState(false);
  const { data: categories } = useCategories();
  const { filters, setFilters, resetFilters, activeFilterCount } =
    useTransactionFilters();

  const options: CategoryOption[] = useMemo(
    () =>
      (categories ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon ?? undefined,
        parentId: c.parentId ?? null,
      })),
    [categories]
  );

  useEffect(() => {
    if (!categories || !filters.categoryIds) return;
    const known = new Set(categories.map((c) => c.id));
    const cleaned = sanitizeCategoryIds(filters.categoryIds, known);
    if ((cleaned?.length ?? 0) !== (filters.categoryIds?.length ?? 0)) {
      setFilters({ categoryIds: cleaned });
    }
  }, [categories, filters.categoryIds, setFilters]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="secondary" className="gap-1">
          <SlidersHorizontalIcon className="size-3" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="default" className="ml-1 h-4 px-1 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Narrow the transactions list by preset, category, and amount.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6">
          <section className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Preset
            </span>
            <PresetChips
              value={filters.preset}
              onChange={(preset) => setFilters({ preset })}
            />
          </section>

          <section className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Category
            </span>
            <CategoryMultiSelect
              options={options}
              value={filters.categoryIds ?? []}
              onChange={(next) =>
                setFilters({ categoryIds: next.length > 0 ? next : undefined })
              }
              showInlinePills
            />
          </section>

          <section className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Amount
            </span>
            <AmountRangeInputs
              min={filters.minAmount}
              max={filters.maxAmount}
              onCommit={({ min, max }) =>
                setFilters({ minAmount: min, maxAmount: max })
              }
            />
          </section>

          <FilterResetButton
            visible={activeFilterCount > 0}
            onReset={() => {
              resetFilters();
              setOpen(false);
            }}
            className="self-start"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `pnpm --filter=web typecheck`
Expected: PASS. If `SheetDescription` isn't exported, drop that line; it's cosmetic.

```bash
git add apps/web/src/features/transactions/components/filters/TransactionFiltersSheet.tsx
git commit -m "feat(web): TransactionFiltersSheet mobile container"
```

---

## Task 15: Feature barrel and `FilteredEmpty` component

**Files:**
- Create: `apps/web/src/features/transactions/components/filters/index.ts`
- Create: `apps/web/src/features/transactions/components/transactions-page/FilteredEmpty.tsx`

- [ ] **Step 1: Barrel exports**

Create `apps/web/src/features/transactions/components/filters/index.ts`:

```ts
export { TransactionFilters } from "./TransactionFilters";
export { TransactionFiltersSheet } from "./TransactionFiltersSheet";
export { SearchInput } from "./components/SearchInput";
export { useTransactionFilters } from "./use-transaction-filters";
export { toApiQuery } from "./filter-utils";
export type {
  TransactionFilterPreset,
  TransactionFilterState,
} from "./filter-types";
```

- [ ] **Step 2: `FilteredEmpty` component**

Create `apps/web/src/features/transactions/components/transactions-page/FilteredEmpty.tsx`:

```tsx
import { FilterIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Empty, EmptyDescription, EmptyTitle } from "@workspace/ui/components/empty";

export interface FilteredEmptyProps {
  onReset: () => void;
}

export function FilteredEmpty({ onReset }: FilteredEmptyProps) {
  return (
    <Empty>
      <FilterIcon className="size-8 text-muted-foreground" aria-hidden />
      <EmptyTitle>No transactions match these filters</EmptyTitle>
      <EmptyDescription>
        Try broadening your search or clearing a filter.
      </EmptyDescription>
      <Button type="button" variant="outline" size="sm" onClick={onReset}>
        Reset filters
      </Button>
    </Empty>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter=web typecheck`
Expected: PASS. If `Empty` doesn't expose `EmptyTitle`/`EmptyDescription`, inline the structure using plain divs matching existing `EmptyTransactions` styling (run `cat apps/web/src/features/transactions/components/transactions-page/EmptyTransactions.tsx` to see the pattern, and mirror it).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/transactions/components/filters/index.ts apps/web/src/features/transactions/components/transactions-page/FilteredEmpty.tsx
git commit -m "feat(web): filters barrel + FilteredEmpty component"
```

---

## Task 16: Wire filters into `TransactionsPage` and add `keepPreviousData`

**Files:**
- Modify: `apps/web/src/features/transactions/components/transactions-page/TransactionsPage.tsx`
- Modify: `apps/web/src/features/transactions/api/use-transactions.ts`

- [ ] **Step 1: Add `keepPreviousData` to `useTransactions`**

In `apps/web/src/features/transactions/api/use-transactions.ts`, update the hook:

```ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
// …

export function useTransactions(filters?: TransactionQuery) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: ({ signal }) =>
      apiClient<{ transactions: Transaction[]; total: number }>(
        "/transactions",
        {
          params: toQueryParams(filters as Record<string, unknown>),
          signal,
        }
      ),
    placeholderData: keepPreviousData,
  });
}
```

Also: `toQueryParams` coerces values to strings via `String(value)`. An array like `["a", "b"]` becomes `"a,b"`, which is exactly what the API route expects (comma-separated string). No extra serialization needed.

- [ ] **Step 2: Update `TransactionsPage.tsx`**

Replace `apps/web/src/features/transactions/components/transactions-page/TransactionsPage.tsx` with:

```tsx
import React, { useMemo, useState } from "react";
import type { Transaction } from "@workspace/types";

import { TimeGrainSelect } from "@/components/TimeGrainSelect";
import { useUiActions } from "@/hooks/use-ui-store";
import { useLayoutConfig } from "@/features/layout";
import { useAccounts } from "@/features/accounts/api/use-accounts";
import { useCategories } from "@/features/categories/api/use-categories";
import { formatCurrency } from "@/features/accounts/lib/format-utils";

import { useTransactions } from "../../api/use-transactions";
import { TransactionItem } from "./TransactionItem";
import { TListLoader } from "./TListLoader";
import { EditTransactionDialog } from "./EditTransactionDialog";
import { DeleteTransactionDialog } from "./DeleteTransactionDialog";
import { EmptyTransactions } from "./EmptyTransactions";
import { FilteredEmpty } from "./FilteredEmpty";
import {
  TransactionsSummaryContent,
  TransactionsSummaryMobile,
} from "./TransactionsSidebar";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
} from "@workspace/ui/components/item";
import { format } from "date-fns";
import { Badge } from "@workspace/ui/components/badge";
import { calculateTransactionGroupTotals, groupByDate } from "../../utils";
import { DateRangeFilter } from "@/features/filters/DateRangeFilter";
import { Card, CardContent } from "@workspace/ui/components/card";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Separator } from "@workspace/ui/components/separator";
import { useDateRange } from "@/hooks/use-filters";
import { parseDateString, toDateString } from "@/lib/timezone";
import {
  SearchInput,
  TransactionFilters,
  TransactionFiltersSheet,
  toApiQuery,
  useTransactionFilters,
} from "../filters";

export function TransactionsPage() {
  const { to, from } = useDateRange();
  const { setOpenCreateTransaction } = useUiActions();
  const {
    filters: filterState,
    setFilters,
    resetFilters,
    activeFilterCount,
  } = useTransactionFilters();

  const queryFilters = useMemo(
    () =>
      toApiQuery(filterState, {
        startDate: toDateString(from),
        endDate: toDateString(to),
      }),
    [filterState, from, to]
  );

  const { data, isLoading } = useTransactions(queryFilters);
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);

  const accountMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts?.forEach((a) => map.set(a.id, a.name));
    return map;
  }, [accounts]);

  const categoryMap = useMemo(() => {
    const map = new Map<
      string,
      { name: string; icon?: string; color?: string; parentId?: string | null }
    >();
    categories?.forEach((c) =>
      map.set(c.id, {
        name: c.name,
        icon: c.icon,
        color: c.color,
        parentId: c.parentId,
      })
    );
    return map;
  }, [categories]);

  const transactions = useMemo(() => data?.transactions ?? [], [data]);

  const sidebarContent = useMemo(
    () =>
      transactions.length > 0 ? (
        <TransactionsSummaryContent
          transactions={transactions}
          categoryMap={categoryMap}
          accountMap={accountMap}
        />
      ) : null,
    [transactions, categoryMap, accountMap]
  );

  useLayoutConfig({
    pageTitle: "Transactions",
    actions: <TimeGrainSelect />,
    leftSidebarContent: sidebarContent,
  });

  const grouped = useMemo(() => groupByDate(transactions), [transactions]);
  const totalsByDate = useMemo(() => {
    const totals: Record<string, { income: number; debit: number }> = {};
    for (const dateKey of Object.keys(grouped)) {
      totals[dateKey] = calculateTransactionGroupTotals(grouped[dateKey]);
    }
    return totals;
  }, [grouped]);
  const sortedDates = useMemo(
    () => Object.keys(grouped).sort((a, b) => b.localeCompare(a)),
    [grouped]
  );

  if (isLoading) {
    return (
      <div className="mx-auto my-auto flex w-full flex-col gap-3 p-4">
        <TListLoader />
      </div>
    );
  }

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      {/* Row 1: global date range */}
      <DateRangeFilter />

      {/* Row 2: desktop filters */}
      <div className="hidden lg:block">
        <TransactionFilters />
      </div>

      {/* Row 2 (mobile): search + Filters sheet + summary */}
      <div className="flex items-center gap-2 lg:hidden">
        <SearchInput
          value={filterState.q ?? ""}
          onDebouncedChange={(next) =>
            setFilters({ q: next.length > 0 ? next : undefined })
          }
          className="min-w-0 flex-1"
        />
        <TransactionFiltersSheet />
        <TransactionsSummaryMobile
          transactions={transactions}
          categoryMap={categoryMap}
          accountMap={accountMap}
        />
      </div>

      {transactions.length === 0 ? (
        <div className="mx-auto my-auto mt-32 flex w-full flex-col gap-3">
          {hasActiveFilters ? (
            <FilteredEmpty onReset={resetFilters} />
          ) : (
            <EmptyTransactions
              openCreateTransaction={setOpenCreateTransaction}
            />
          )}
        </div>
      ) : (
        <Card className="p-0">
          <CardContent className="p-0">
            <ScrollArea className="h-[75svh]">
              <div>
                {sortedDates.map((date) => {
                  const groupedTransactions = grouped[date];
                  const totals = totalsByDate[date] ?? {
                    income: 0,
                    debit: 0,
                  };

                  return (
                    <section key={date}>
                      <Item
                        id={`summary-${date}`}
                        className="sticky top-0 h-12 items-center justify-between gap-4 rounded-none border-b-border bg-muted px-3"
                      >
                        <ItemContent className="flex flex-row items-center gap-2">
                          <Badge className="rounded-sm" variant="default">
                            {format(parseDateString(date), "EEE")}
                          </Badge>
                          <p className="text-xs">
                            {format(parseDateString(date), "dd MMM, y")}
                          </p>
                        </ItemContent>
                        <ItemActions>
                          <small className="w-16 truncate text-xs text-foreground">
                            {formatCurrency(totals.income)}
                          </small>
                          <small className="w-16 truncate text-right text-xs text-foreground">
                            {formatCurrency(totals.debit)}
                          </small>
                        </ItemActions>
                      </Item>

                      <ItemGroup className="flex flex-col gap-0">
                        {groupedTransactions.map((tx, index) => {
                          const cat = tx.categoryId
                            ? categoryMap.get(tx.categoryId)
                            : undefined;
                          const accountName =
                            accountMap.get(tx.accountId) ?? "Unknown";
                          const linkedAccountName = tx.linkedAccountId
                            ? (accountMap.get(tx.linkedAccountId) ?? "Unknown")
                            : undefined;
                          const categoryName =
                            tx.type === "TRANSFER"
                              ? tx.direction === "OUTFLOW"
                                ? "Transfer out"
                                : "Transfer in"
                              : (cat?.name ?? "Uncategorized");
                          const formattedAmount = formatCurrency(
                            Number(tx.signedAmount)
                          );
                          const merchantSub =
                            tx.type === "TRANSFER" && linkedAccountName
                              ? tx.direction === "OUTFLOW"
                                ? `${accountName} -> ${linkedAccountName}`
                                : `${linkedAccountName} -> ${accountName}`
                              : accountName;

                          return (
                            <React.Fragment key={tx.id}>
                              <TransactionItem
                                className={
                                  groupedTransactions.length - 1 === index
                                    ? "rounded-t-none! rounded-b-sm"
                                    : "rounded-none!"
                                }
                                id={Number(tx.id) || 0}
                                category={categoryName}
                                categorySub={cat?.icon ?? undefined}
                                merchant={
                                  tx.description || tx.type.toLowerCase()
                                }
                                merchantSub={merchantSub}
                                amount={formattedAmount}
                                type={tx.type}
                                onClick={() => setEditTx(tx)}
                                aria-label={`${tx.type} ${tx.description ?? ""} ${formattedAmount}`}
                              />
                              <Separator className="m-0" />
                            </React.Fragment>
                          );
                        })}
                      </ItemGroup>
                    </section>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <EditTransactionDialog
        open={!!editTx}
        onOpenChange={(open) => {
          if (!open) setEditTx(null);
        }}
        transaction={editTx}
        onDelete={(tx) => {
          setEditTx(null);
          setDeleteTx(tx);
        }}
      />

      <DeleteTransactionDialog
        open={!!deleteTx}
        onOpenChange={(open) => {
          if (!open) setDeleteTx(null);
        }}
        transaction={deleteTx}
      />
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + test + lint**

Run: `pnpm --filter=web typecheck && pnpm --filter=web test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/transactions/components/transactions-page/TransactionsPage.tsx apps/web/src/features/transactions/api/use-transactions.ts
git commit -m "feat(web): wire URL-backed filters into TransactionsPage"
```

---

## Task 17: End-to-end verification

**Files:** none modified — this is manual validation.

- [ ] **Step 1: Seed and boot both apps**

Run (in separate terminals or tabs):

```bash
pnpm db:bootstrap:seed
pnpm dev
```

- [ ] **Step 2: Desktop smoke test**

Open `http://localhost:5173/transactions` in a browser wider than `lg`:

- [ ] All four preset chips render and toggle selection
- [ ] Typing in Search debounces, updates the URL (`?q=…`), and filters the list (verify with a seeded merchant name)
- [ ] Opening Category opens a popover with a searchable list; picking two categories shows pills and filters the list; URL has `?categoryIds=…,…`
- [ ] Typing `100` in Min and blurring updates URL `?minAmount=100` and filters the list
- [ ] Setting Min > Max and blurring swaps them silently
- [ ] Picking "Uncategorized" then picking a category switches preset back to "All" silently
- [ ] Reset button appears when filters are active; clicking clears all params and widgets
- [ ] Hitting browser Back after a few filter changes does **not** walk through every keystroke (thanks to `replace: true`)
- [ ] Reloading the page with a filtered URL restores the exact filter state
- [ ] Sidebar breakdowns still render for the filtered list
- [ ] When filters match zero results: `FilteredEmpty` renders with a working Reset

- [ ] **Step 3: Mobile smoke test**

Open dev tools, switch to a narrow viewport (< `lg`):

- [ ] DateRangeFilter stays at the top, full-width
- [ ] Row 2: Search + "Filters" button + summary button
- [ ] Filters button shows a badge with the active count when any filter is set
- [ ] Clicking opens a Sheet with Preset / Category / Amount sections and a Reset button
- [ ] Changes made in the sheet update URL and list; closing the sheet preserves state

- [ ] **Step 4: Full suite**

```bash
pnpm typecheck && pnpm test && pnpm lint
```

Expected: PASS on all three.

- [ ] **Step 5: Commit any formatting / lint fixups (if any)**

```bash
# only if files changed
git add -A
git commit -m "chore: format / lint fixups post filter integration"
```

---

## Self-Review

**1. Spec coverage**
- §4 Scope — Task 5 (URL schema), 6 (utils), 7 (hook), 8–12 (widgets), 13–14 (containers), 16 (integration) ✓
- §5 UX — Desktop row layout (Task 16), mobile sheet (Task 14), widget behaviors (Tasks 8–11) ✓
- §6 URL shape — Task 5 matches `TransactionsSearchSchema` exactly ✓
- §6 URL → API mapping — Task 6 `toApiQuery` tests lock each row of the mapping ✓
- §6 Invalid URL handling — Zod `.catch()` in Task 5 ✓; `sanitizeCategoryIds` in Task 6 ✓
- §7 Component architecture — matches created files exactly ✓
- §7 `placeholderData: keepPreviousData` — Task 16 Step 1 ✓
- §8 Backend — Tasks 1 (types), 2 (route), 3 (service + tests) ✓
- §9 Edge cases — stale category cleanup (Task 13/14 `useEffect`), min>max swap (Task 6 + Task 7), preset/category exclusion (Task 7), filtered-empty state (Tasks 15/16) ✓
- §10 Testing — backend service tests (Task 3), pure util tests (Task 6), manual desktop+mobile smoke (Task 17) ✓

**2. Placeholder scan** — no TBDs, no "similar to…", no "handle edge cases" without code. ✓

**3. Type consistency** — `TransactionFilterState`, `TransactionFilterPreset`, `CategoryOption`, `TransactionQuery`, `TransactionsSearchSchema` — all used with the same shape across tasks. `useTransactionFilters` returns `{ filters, setFilters, setPreset, resetFilters, activeFilterCount }` and every container consumes only documented fields. ✓
