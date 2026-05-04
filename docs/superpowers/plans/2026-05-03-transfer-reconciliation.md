# Transfer Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user promote an imported pending-transfer row (INCOME/EXPENSE with a `transferId`) into a real TRANSFER pair via a button inside the Edit Transaction dialog.

**Architecture:** Add a `transferId` filter to the list endpoint so the dialog can look up a row's counter leg. Add one new endpoint `POST /transactions/:id/merge-as-transfer` that upgrades the row's type in place (pair case) or inserts a new counter leg in a user-picked account (orphan case). Render a new `MergeTransferPanel` at the top of the income/expense edit form that calls the endpoint and closes the dialog.

**Tech Stack:** Hono + `@hono/zod-openapi` on the API, Drizzle ORM, React + TanStack Query + React Hook Form on the web, Vitest for tests.

**Spec:** `docs/superpowers/specs/2026-05-03-transfer-reconciliation-design.md`

---

## Task 1: Add `transferId` to the list filter schema

**Files:**
- Modify: `packages/types/src/schema.ts`
- Modify: `apps/api/src/routes/transactions.ts`
- Modify: `apps/api/src/services/transactions.service.ts`

- [ ] **Step 1: Add `transferId` to the shared `TransactionQuerySchema`**

In `packages/types/src/schema.ts`, inside `TransactionQuerySchema` (the object that starts around line 432), add a new optional field right after `isCleared`:

```ts
  isCleared: z.boolean().optional(),
  transferId: z.string().optional(),
  search: z.string().optional(),
```

- [ ] **Step 2: Mirror the field in the route-level query schema**

In `apps/api/src/routes/transactions.ts`, in `TransactionQueryRouteSchema` (around line 27), add `transferId` right after the `isCleared` transform:

```ts
  isCleared: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  transferId: z.string().optional(),
  search: z.string().optional(),
```

- [ ] **Step 3: Apply the filter in `listTransactions`**

In `apps/api/src/services/transactions.service.ts`, inside `listTransactions`, in the block that builds `conditions` (around lines 48-83), add after the `isCleared` branch:

```ts
    if (filters?.isCleared !== undefined) {
      conditions.push(eq(transactions.isCleared, filters.isCleared));
    }
    if (filters?.transferId) {
      conditions.push(eq(transactions.transferId, filters.transferId));
    }
    if (filters?.search?.trim()) {
```

- [ ] **Step 4: Verify typecheck passes**

Run: `cd /Users/sameer.waskar/Work/mlabs && pnpm typecheck`
Expected: `Tasks: 3 successful, 3 total`

- [ ] **Step 5: Verify existing tests still pass**

Run: `cd /Users/sameer.waskar/Work/mlabs/apps/api && pnpm test`
Expected: `Tests  9 passed (9)`

- [ ] **Step 6: Commit**

```bash
git add packages/types/src/schema.ts apps/api/src/routes/transactions.ts apps/api/src/services/transactions.service.ts
git commit -m "[api] add transferId filter to GET /transactions"
```

---

## Task 2: Service method — pair case (happy path)

**Files:**
- Modify: `apps/api/src/services/transactions.service.test.ts`
- Modify: `apps/api/src/services/transactions.service.ts`

- [ ] **Step 1: Write the failing test — seeds two legs and merges them**

Append to `apps/api/src/services/transactions.service.test.ts` (after the last `describe` block, before end of file):

```ts
describe("mergeAsTransfer — pair case", () => {
  const ACCT_A = "00000000-0000-0000-0000-0000000000c1";
  const ACCT_B = "00000000-0000-0000-0000-0000000000c2";
  const PENDING_OUT = "20000000-0000-0000-0000-000000000001";
  const PENDING_IN = "20000000-0000-0000-0000-000000000002";
  const PAIR_XID = "XFER-PAIR-TEST";

  beforeAll(async () => {
    await dbMod.db.insert(schemaMod.accounts).values([
      { id: ACCT_A, profileId: PROFILE_ID, name: "A", group: "chequing", currency: "CAD", balance: "500" },
      { id: ACCT_B, profileId: PROFILE_ID, name: "B", group: "chequing", currency: "CAD", balance: "1000" },
    ]);
    await dbMod.db.insert(schemaMod.transactions).values([
      {
        id: PENDING_OUT,
        profileId: PROFILE_ID,
        accountId: ACCT_A,
        type: "EXPENSE",
        amount: "200",
        description: "A to B",
        date: "2026-05-10",
        transferId: PAIR_XID,
      },
      {
        id: PENDING_IN,
        profileId: PROFILE_ID,
        accountId: ACCT_B,
        type: "INCOME",
        amount: "200",
        description: "A to B",
        date: "2026-05-10",
        transferId: PAIR_XID,
      },
    ]);
  });

  it("upgrades both legs to TRANSFER and leaves balances unchanged", async () => {
    const before = await dbMod.db.select().from(schemaMod.accounts);
    const balancesBefore = Object.fromEntries(before.map((a) => [a.id, a.balance]));

    const merged = await service.mergeAsTransfer(PROFILE_ID, PENDING_OUT);

    expect(merged).toHaveLength(2);
    for (const row of merged) expect(row.type).toBe("TRANSFER");
    const ids = merged.map((r) => r.id).sort();
    expect(ids).toEqual([PENDING_IN, PENDING_OUT].sort());
    for (const row of merged) expect(row.transferId).toBe(PAIR_XID);

    const after = await dbMod.db.select().from(schemaMod.accounts);
    const balancesAfter = Object.fromEntries(after.map((a) => [a.id, a.balance]));
    expect(balancesAfter[ACCT_A]).toBe(balancesBefore[ACCT_A]);
    expect(balancesAfter[ACCT_B]).toBe(balancesBefore[ACCT_B]);

    const rows = await dbMod.db
      .select()
      .from(schemaMod.transactions)
      .where(
        and(
          eq(schemaMod.transactions.id, PENDING_OUT),
          eq(schemaMod.transactions.profileId, PROFILE_ID)
        )
      );
    expect(rows[0]?.categoryId).toBeNull();
  });
});
```

You will also need to import `and` and `eq` at the top of the test file. Locate the imports near line 1 and add to the existing `import { ... } from "vitest"` line alongside a new drizzle import:

```ts
import { and, eq } from "drizzle-orm";
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `cd /Users/sameer.waskar/Work/mlabs/apps/api && pnpm test -- -t "mergeAsTransfer — pair case"`
Expected: FAIL with `service.mergeAsTransfer is not a function`.

- [ ] **Step 3: Implement `mergeAsTransfer` with the pair case only**

In `apps/api/src/services/transactions.service.ts`, after the `deleteTransaction` method (inside the `TransactionsService` class, just before the closing brace of the class), add:

```ts
  // ---------------------------------------------------------------------------
  // MERGE AS TRANSFER
  // ---------------------------------------------------------------------------
  async mergeAsTransfer(
    profileId: string,
    pendingId: string,
    opts?: { counterAccountId?: string }
  ): Promise<Transaction[]> {
    return db.transaction(async (tx) => {
      const [pending] = await tx
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.id, pendingId),
            eq(transactions.profileId, profileId)
          )
        )
        .limit(1);

      if (!pending) {
        throw new NotFoundError(
          "Transaction not found",
          "TRANSACTION_NOT_FOUND"
        );
      }

      if (pending.type === "TRANSFER") {
        throw new BadRequestError(
          "Transaction is already a transfer",
          "ALREADY_TRANSFER"
        );
      }

      if (!pending.transferId) {
        throw new BadRequestError(
          "Transaction has no transferId — delete and recreate as a transfer",
          "NO_TRANSFER_ID"
        );
      }

      const groupRows = await tx
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.transferId, pending.transferId),
            eq(transactions.profileId, profileId)
          )
        );

      if (groupRows.length > 2) {
        throw new BadRequestError(
          `Found ${groupRows.length} transactions sharing this transferId. Remove duplicates before merging.`,
          "AMBIGUOUS_TRANSFER_GROUP"
        );
      }

      const counter = groupRows.find((r) => r.id !== pending.id);

      if (counter) {
        if (counter.accountId === pending.accountId) {
          throw new BadRequestError(
            "Both transfer legs are on the same account",
            "SAME_ACCOUNT_TRANSFER"
          );
        }

        await tx
          .update(transactions)
          .set({
            type: "TRANSFER",
            categoryId: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              inArray(transactions.id, [pending.id, counter.id]),
              eq(transactions.profileId, profileId)
            )
          );

        const refreshed = await tx
          .select()
          .from(transactions)
          .where(
            and(
              inArray(transactions.id, [pending.id, counter.id]),
              eq(transactions.profileId, profileId)
            )
          );

        const categoryParentMap = await loadCategoryParentMap(profileId);
        return serializeTransactions(refreshed, categoryParentMap);
      }

      throw new BadRequestError(
        "Counter account is required when no paired leg exists",
        "COUNTER_ACCOUNT_REQUIRED"
      );
    });
  }
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `cd /Users/sameer.waskar/Work/mlabs/apps/api && pnpm test -- -t "mergeAsTransfer — pair case"`
Expected: PASS.

- [ ] **Step 5: Run the full API test suite**

Run: `cd /Users/sameer.waskar/Work/mlabs/apps/api && pnpm test`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/services/transactions.service.test.ts apps/api/src/services/transactions.service.ts
git commit -m "[api] mergeAsTransfer: pair case upgrades both legs in place"
```

---

## Task 3: Service method — orphan case (creates counter leg)

**Files:**
- Modify: `apps/api/src/services/transactions.service.test.ts`
- Modify: `apps/api/src/services/transactions.service.ts`

- [ ] **Step 1: Write the failing test for orphan EXPENSE → creates INFLOW counter**

Append a new `describe` block to `apps/api/src/services/transactions.service.test.ts`:

```ts
describe("mergeAsTransfer — orphan case", () => {
  const ACCT_SRC = "00000000-0000-0000-0000-0000000000d1";
  const ACCT_DST = "00000000-0000-0000-0000-0000000000d2";
  const ORPHAN_OUT = "30000000-0000-0000-0000-000000000001";
  const ORPHAN_IN = "30000000-0000-0000-0000-000000000002";

  beforeAll(async () => {
    await dbMod.db.insert(schemaMod.accounts).values([
      { id: ACCT_SRC, profileId: PROFILE_ID, name: "Src", group: "chequing", currency: "CAD", balance: "800" },
      { id: ACCT_DST, profileId: PROFILE_ID, name: "Dst", group: "chequing", currency: "CAD", balance: "300" },
    ]);
    await dbMod.db.insert(schemaMod.transactions).values([
      {
        id: ORPHAN_OUT,
        profileId: PROFILE_ID,
        accountId: ACCT_SRC,
        type: "EXPENSE",
        amount: "150",
        description: "Src to Dst",
        date: "2026-05-11",
        transferId: "XFER-ORPH-OUT",
      },
      {
        id: ORPHAN_IN,
        profileId: PROFILE_ID,
        accountId: ACCT_DST,
        type: "INCOME",
        amount: "50",
        description: "Dst from Src",
        date: "2026-05-12",
        transferId: "XFER-ORPH-IN",
      },
    ]);
  });

  it("creates counter inflow when pending is EXPENSE and credits the destination", async () => {
    const dstBefore = (
      await dbMod.db
        .select()
        .from(schemaMod.accounts)
        .where(eq(schemaMod.accounts.id, ACCT_DST))
    )[0]?.balance;

    const merged = await service.mergeAsTransfer(PROFILE_ID, ORPHAN_OUT, {
      counterAccountId: ACCT_DST,
    });

    expect(merged).toHaveLength(2);
    for (const row of merged) expect(row.type).toBe("TRANSFER");
    for (const row of merged) expect(row.transferId).toBe("XFER-ORPH-OUT");

    const dstAfter = (
      await dbMod.db
        .select()
        .from(schemaMod.accounts)
        .where(eq(schemaMod.accounts.id, ACCT_DST))
    )[0]?.balance;

    expect(Number(dstAfter)).toBe(Number(dstBefore) + 150);
  });

  it("creates counter outflow when pending is INCOME and debits the destination", async () => {
    const dstBefore = (
      await dbMod.db
        .select()
        .from(schemaMod.accounts)
        .where(eq(schemaMod.accounts.id, ACCT_SRC))
    )[0]?.balance;

    const merged = await service.mergeAsTransfer(PROFILE_ID, ORPHAN_IN, {
      counterAccountId: ACCT_SRC,
    });

    expect(merged).toHaveLength(2);
    for (const row of merged) expect(row.type).toBe("TRANSFER");

    const dstAfter = (
      await dbMod.db
        .select()
        .from(schemaMod.accounts)
        .where(eq(schemaMod.accounts.id, ACCT_SRC))
    )[0]?.balance;

    expect(Number(dstAfter)).toBe(Number(dstBefore) - 50);
  });
});
```

- [ ] **Step 2: Run the new tests to confirm they fail**

Run: `cd /Users/sameer.waskar/Work/mlabs/apps/api && pnpm test -- -t "mergeAsTransfer — orphan case"`
Expected: FAIL with `COUNTER_ACCOUNT_REQUIRED` (because the orphan branch still throws).

- [ ] **Step 3: Implement the orphan branch**

In `apps/api/src/services/transactions.service.ts`, inside `mergeAsTransfer`, replace the final `throw new BadRequestError("Counter account is required...")` with:

```ts
      if (!opts?.counterAccountId) {
        throw new BadRequestError(
          "Counter account is required when no paired leg exists",
          "COUNTER_ACCOUNT_REQUIRED"
        );
      }

      if (opts.counterAccountId === pending.accountId) {
        throw new BadRequestError(
          "Counter account must be different from the source account",
          "SAME_ACCOUNT_TRANSFER"
        );
      }

      const [counterAccount] = await tx
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.id, opts.counterAccountId),
            eq(accounts.profileId, profileId)
          )
        )
        .limit(1);

      if (!counterAccount) {
        throw new NotFoundError("Account not found", "ACCOUNT_NOT_FOUND");
      }

      await tx
        .update(transactions)
        .set({
          type: "TRANSFER",
          categoryId: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(transactions.id, pending.id),
            eq(transactions.profileId, profileId)
          )
        );

      const [inserted] = await tx
        .insert(transactions)
        .values({
          profileId,
          accountId: opts.counterAccountId,
          type: "TRANSFER",
          amount: pending.amount,
          description: pending.description,
          notes: pending.notes,
          date: pending.date,
          isCleared: pending.isCleared,
          transferId: pending.transferId,
        })
        .returning();

      if (!inserted) {
        throw new InternalServerError(
          "Failed to create counter leg",
          "COUNTER_LEG_CREATE_FAILED"
        );
      }

      const balanceDelta =
        pending.type === "EXPENSE"
          ? Number(pending.amount)
          : -Number(pending.amount);

      await tx
        .update(accounts)
        .set({
          balance: String(Number(counterAccount.balance) + balanceDelta),
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, opts.counterAccountId));

      const refreshed = await tx
        .select()
        .from(transactions)
        .where(
          and(
            inArray(transactions.id, [pending.id, inserted.id]),
            eq(transactions.profileId, profileId)
          )
        );

      const categoryParentMap = await loadCategoryParentMap(profileId);
      return serializeTransactions(refreshed, categoryParentMap);
```

- [ ] **Step 4: Run the orphan tests to confirm they pass**

Run: `cd /Users/sameer.waskar/Work/mlabs/apps/api && pnpm test -- -t "mergeAsTransfer — orphan case"`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full API test suite**

Run: `cd /Users/sameer.waskar/Work/mlabs/apps/api && pnpm test`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/services/transactions.service.test.ts apps/api/src/services/transactions.service.ts
git commit -m "[api] mergeAsTransfer: orphan case inserts counter leg"
```

---

## Task 4: Service method — error paths

**Files:**
- Modify: `apps/api/src/services/transactions.service.test.ts`

- [ ] **Step 1: Write failing tests for all four error codes**

Append a new `describe` block to `apps/api/src/services/transactions.service.test.ts`:

```ts
describe("mergeAsTransfer — errors", () => {
  const ACCT = "00000000-0000-0000-0000-0000000000e1";
  const NO_XID = "40000000-0000-0000-0000-000000000001";
  const ALREADY_T = "40000000-0000-0000-0000-000000000002";
  const AMBIG_1 = "40000000-0000-0000-0000-000000000003";
  const AMBIG_2 = "40000000-0000-0000-0000-000000000004";
  const AMBIG_3 = "40000000-0000-0000-0000-000000000005";
  const ORPHAN = "40000000-0000-0000-0000-000000000006";
  const AMBIG_XID = "XFER-AMBIG";

  beforeAll(async () => {
    await dbMod.db.insert(schemaMod.accounts).values([
      { id: ACCT, profileId: PROFILE_ID, name: "Err", group: "chequing", currency: "CAD", balance: "0" },
    ]);
    await dbMod.db.insert(schemaMod.transactions).values([
      { id: NO_XID, profileId: PROFILE_ID, accountId: ACCT, type: "EXPENSE", amount: "10", date: "2026-05-13" },
      { id: ALREADY_T, profileId: PROFILE_ID, accountId: ACCT, type: "TRANSFER", amount: "10", date: "2026-05-13", transferId: "XFER-T" },
      { id: AMBIG_1, profileId: PROFILE_ID, accountId: ACCT, type: "EXPENSE", amount: "10", date: "2026-05-13", transferId: AMBIG_XID },
      { id: AMBIG_2, profileId: PROFILE_ID, accountId: ACCT, type: "INCOME", amount: "10", date: "2026-05-13", transferId: AMBIG_XID },
      { id: AMBIG_3, profileId: PROFILE_ID, accountId: ACCT, type: "INCOME", amount: "10", date: "2026-05-13", transferId: AMBIG_XID },
      { id: ORPHAN, profileId: PROFILE_ID, accountId: ACCT, type: "EXPENSE", amount: "10", date: "2026-05-13", transferId: "XFER-LONELY" },
    ]);
  });

  it("throws NO_TRANSFER_ID when transferId is null", async () => {
    await expect(service.mergeAsTransfer(PROFILE_ID, NO_XID)).rejects.toMatchObject({
      code: "NO_TRANSFER_ID",
    });
  });

  it("throws ALREADY_TRANSFER when row is already TRANSFER", async () => {
    await expect(service.mergeAsTransfer(PROFILE_ID, ALREADY_T)).rejects.toMatchObject({
      code: "ALREADY_TRANSFER",
    });
  });

  it("throws AMBIGUOUS_TRANSFER_GROUP when >2 rows share transferId", async () => {
    await expect(service.mergeAsTransfer(PROFILE_ID, AMBIG_1)).rejects.toMatchObject({
      code: "AMBIGUOUS_TRANSFER_GROUP",
    });
  });

  it("throws COUNTER_ACCOUNT_REQUIRED for orphan without counterAccountId", async () => {
    await expect(service.mergeAsTransfer(PROFILE_ID, ORPHAN)).rejects.toMatchObject({
      code: "COUNTER_ACCOUNT_REQUIRED",
    });
  });

  it("throws SAME_ACCOUNT_TRANSFER when counterAccountId equals source account", async () => {
    await expect(
      service.mergeAsTransfer(PROFILE_ID, ORPHAN, { counterAccountId: ACCT })
    ).rejects.toMatchObject({ code: "SAME_ACCOUNT_TRANSFER" });
  });
});
```

- [ ] **Step 2: Run the error tests**

Run: `cd /Users/sameer.waskar/Work/mlabs/apps/api && pnpm test -- -t "mergeAsTransfer — errors"`
Expected: PASS (5 tests). No implementation changes needed — the service already throws all five.

- [ ] **Step 3: Run the full API test suite**

Run: `cd /Users/sameer.waskar/Work/mlabs/apps/api && pnpm test`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/services/transactions.service.test.ts
git commit -m "[api] mergeAsTransfer: error-path coverage"
```

---

## Task 5: Wire the new route

**Files:**
- Modify: `apps/api/src/routes/transactions.ts`

- [ ] **Step 1: Add the route definition at the bottom of the file**

In `apps/api/src/routes/transactions.ts`, before `export default transactionsRoute;`, add:

```ts
// ---------------------------------------------------------------------------
// POST /:id/merge-as-transfer — Promote pending transfer to real transfer
// ---------------------------------------------------------------------------

const MergeAsTransferBodySchema = z.object({
  counterAccountId: z.string().uuid().optional(),
});

const mergeAsTransferRoute = createRoute({
  method: "post",
  path: "/{id}/merge-as-transfer",
  tags: ["Transactions"],
  summary: "Merge pending transfer leg",
  description:
    "Promotes an imported pending transfer row (INCOME/EXPENSE with a transferId) into a real TRANSFER. If a counter leg with the same transferId exists, both are upgraded in place. Otherwise a counter leg is created in the counterAccountId provided.",
  request: {
    params: IdParamSchema,
    body: {
      content: { "application/json": { schema: MergeAsTransferBodySchema } },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: apiResponseSchema(z.array(TransactionSchema)),
        },
      },
      description: "Merged transfer (both legs)",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Merge not possible (see error code)",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Transaction or account not found",
    },
  },
});

transactionsRoute.openapi(mergeAsTransferRoute, async (c) => {
  const profileId = c.get("profileId");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const merged = await transactionsService.mergeAsTransfer(profileId, id, {
    counterAccountId: body.counterAccountId,
  });
  return c.json({ success: true as const, data: merged });
});
```

- [ ] **Step 2: Verify typecheck passes**

Run: `cd /Users/sameer.waskar/Work/mlabs && pnpm typecheck`
Expected: `Tasks: 3 successful, 3 total`.

- [ ] **Step 3: Verify tests still pass**

Run: `cd /Users/sameer.waskar/Work/mlabs/apps/api && pnpm test`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/transactions.ts
git commit -m "[api] POST /transactions/:id/merge-as-transfer"
```

---

## Task 6: Frontend — hooks for counter lookup and merge mutation

**Files:**
- Modify: `apps/web/src/features/transactions/api/use-transactions.ts`

- [ ] **Step 1: Add `useTransferCounterLeg` and `useMergeAsTransfer` hooks**

Append to `apps/web/src/features/transactions/api/use-transactions.ts`:

```ts
export function useTransferCounterLeg(
  transferId: string | null | undefined,
  selfId: string | null | undefined
) {
  return useQuery({
    queryKey: [...transactionKeys.all, "counter", transferId, selfId] as const,
    enabled: !!transferId && !!selfId,
    queryFn: async ({ signal }) => {
      const result = await apiClient<{
        transactions: Transaction[];
        total: number;
      }>("/transactions", {
        params: { transferId: transferId! },
        signal,
      });
      return result;
    },
    select: (result) => {
      const others = result.transactions.filter((t) => t.id !== selfId);
      if (result.transactions.length > 2) return "ambiguous" as const;
      return others[0] ?? null;
    },
  });
}

export function useMergeAsTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      counterAccountId,
    }: {
      id: string;
      counterAccountId?: string;
    }) =>
      apiClient<Transaction[]>(`/transactions/${id}/merge-as-transfer`, {
        method: "POST",
        body: { counterAccountId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
    },
  });
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `cd /Users/sameer.waskar/Work/mlabs && pnpm typecheck`
Expected: `Tasks: 3 successful, 3 total`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/transactions/api/use-transactions.ts
git commit -m "[web] useTransferCounterLeg + useMergeAsTransfer hooks"
```

---

## Task 7: Frontend — `MergeTransferPanel` component

**Files:**
- Create: `apps/web/src/features/transactions/edit-transaction/MergeTransferPanel.tsx`

- [ ] **Step 1: Create the panel component**

Create `apps/web/src/features/transactions/edit-transaction/MergeTransferPanel.tsx`:

```tsx
import { useState } from "react";
import { toast } from "sonner";
import type { Transaction, Account } from "@workspace/types";

import {
  useMergeAsTransfer,
  useTransferCounterLeg,
} from "../api/use-transactions";

import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field";

interface Props {
  transaction: Transaction;
  accounts: Account[] | undefined;
  onMerged: () => void;
}

export function MergeTransferPanel({ transaction, accounts, onMerged }: Props) {
  const transferId = transaction.transferId ?? null;
  const counterQuery = useTransferCounterLeg(transferId, transaction.id);
  const merge = useMergeAsTransfer();
  const [pickedAccountId, setPickedAccountId] = useState("");

  if (!transferId) {
    return (
      <Alert>
        <AlertDescription className="text-xs">
          No transfer id found. Delete and recreate this transaction as a
          transfer if needed.
        </AlertDescription>
      </Alert>
    );
  }

  if (counterQuery.isLoading) {
    return (
      <Alert>
        <AlertDescription className="text-xs">
          Looking up counter leg...
        </AlertDescription>
      </Alert>
    );
  }

  if (counterQuery.data === "ambiguous") {
    return (
      <Alert variant="destructive">
        <AlertDescription className="text-xs">
          More than two rows share this transfer id. Remove duplicates before
          merging.
        </AlertDescription>
      </Alert>
    );
  }

  const counter = counterQuery.data ?? null;

  const handleMerge = (counterAccountId?: string) => {
    merge.mutate(
      { id: transaction.id, counterAccountId },
      {
        onSuccess: () => {
          toast.success("Transfer merged");
          onMerged();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to merge transfer");
        },
      }
    );
  };

  if (counter) {
    const counterAccountName =
      accounts?.find((a) => a.id === counter.accountId)?.name ?? "another account";
    return (
      <Alert>
        <AlertDescription className="flex flex-col gap-2 text-xs">
          <span>
            Paired leg found in <strong>{counterAccountName}</strong>.
          </span>
          <Button
            type="button"
            size="sm"
            disabled={merge.isPending}
            onClick={() => handleMerge()}
            data-testid="tx-merge-transfer"
          >
            {merge.isPending ? "Merging..." : "Merge as transfer"}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const eligibleAccounts = accounts?.filter(
    (a) => a.id !== transaction.accountId
  );

  return (
    <Alert>
      <AlertDescription className="flex flex-col gap-2 text-xs">
        <span>No counter leg found yet. Pick the destination account:</span>
        <Field>
          <FieldLabel htmlFor="merge-counter-account">Counter account</FieldLabel>
          <NativeSelect
            id="merge-counter-account"
            className="w-full"
            value={pickedAccountId}
            onChange={(e) => setPickedAccountId(e.target.value)}
            data-testid="tx-merge-counter-account"
          >
            <NativeSelectOption value="">Select account...</NativeSelectOption>
            {eligibleAccounts?.map((a) => (
              <NativeSelectOption key={a.id} value={a.id}>
                {a.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {pickedAccountId === "" && (
            <FieldError>Required</FieldError>
          )}
        </Field>
        <Button
          type="button"
          size="sm"
          disabled={!pickedAccountId || merge.isPending}
          onClick={() => handleMerge(pickedAccountId)}
          data-testid="tx-merge-transfer"
        >
          {merge.isPending ? "Merging..." : "Create counter leg & merge"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `cd /Users/sameer.waskar/Work/mlabs && pnpm typecheck`
Expected: `Tasks: 3 successful, 3 total`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/transactions/edit-transaction/MergeTransferPanel.tsx
git commit -m "[web] MergeTransferPanel: pair/orphan/ambiguous UI states"
```

---

## Task 8: Frontend — mount the panel in `EditTransactionDialog`

**Files:**
- Modify: `apps/web/src/features/transactions/edit-transaction/EditTransactionDialog.tsx`

- [ ] **Step 1: Import the new panel**

At the top of `apps/web/src/features/transactions/edit-transaction/EditTransactionDialog.tsx`, alongside the existing `CategoryPicker` import, add:

```ts
import { MergeTransferPanel } from "./MergeTransferPanel";
```

- [ ] **Step 2: Render the panel inside `EditIncomeExpenseForm` when the row is a pending transfer**

Inside `EditIncomeExpenseForm`, at the top of the `<FieldGroup>` (before the existing Account `Controller`), add:

```tsx
        {transaction.type !== "TRANSFER" && transaction.transferId && (
          <MergeTransferPanel
            transaction={transaction}
            accounts={accounts}
            onMerged={onClose}
          />
        )}
```

- [ ] **Step 3: Verify typecheck passes**

Run: `cd /Users/sameer.waskar/Work/mlabs && pnpm typecheck`
Expected: `Tasks: 3 successful, 3 total`.

- [ ] **Step 4: Verify web tests still pass**

Run: `cd /Users/sameer.waskar/Work/mlabs/apps/web && pnpm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/transactions/edit-transaction/EditTransactionDialog.tsx
git commit -m "[web] show MergeTransferPanel for pending transfers in edit dialog"
```

---

## Task 9: End-to-end sanity check

- [ ] **Step 1: Run the full lint + typecheck + test matrix**

Run:
```bash
cd /Users/sameer.waskar/Work/mlabs && pnpm lint && pnpm typecheck && (cd apps/api && pnpm test) && (cd apps/web && pnpm test)
```
Expected: every command exits 0.

- [ ] **Step 2: Manual smoke test in the browser**

Run: `cd /Users/sameer.waskar/Work/mlabs && pnpm dev`
Then, in a browser:
1. Import `/Users/sameer.waskar/Desktop/EQ.csv` into the EQ Bank account. Verify the `Transfer-Out -5000` row shows up as **"Transfer out"** on the Transactions page (orphan state).
2. Click that row. The Edit dialog opens. The `MergeTransferPanel` says *"No counter leg found yet"* and shows an account dropdown.
3. Close the dialog. Import `/Users/sameer.waskar/Desktop/WS.csv` into the WealthSimple Cash account.
4. Click the EQ `Transfer out` row again. Panel now says *"Paired leg found in WealthSimple Cash"* with a Merge button.
5. Click Merge. Toast says *"Transfer merged"*. The list now shows a single transfer pair with linked accounts (EQ Bank -> WealthSimple Cash).
6. Verify account balances on the Accounts page are unchanged from before the merge.

- [ ] **Step 3: If all good, push the branch**

```bash
git push -u origin development
```
