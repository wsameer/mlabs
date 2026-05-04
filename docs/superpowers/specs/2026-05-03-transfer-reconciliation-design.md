# Transfer Reconciliation — Design

**Date:** 2026-05-03
**Scope:** Promote imported "pending transfer" rows (INCOME/EXPENSE with `transferId` set) into real TRANSFER rows, handled from the existing Edit Transaction dialog. Backend route + service + EditTransactionDialog UI.
**Out of scope:** Dashboard widget, batch "Merge all" banner, pending-transfer filter preset, reconciliation for rows where `transferId` is blank (the user deletes and recreates those manually).

## Problem

After CSV import, transfer rows live in the DB as INCOME/EXPENSE with a shared `transferId` linking the two legs. That works for cashflow math but:

- The `type` column lies — the Transactions page shows them under income/expense instead of transfers.
- Type-based filters and reports conflate transfers with real income/expense.
- The user has no one-click way to finalize the import.

The user has already confirmed: **this must not require schema changes**, **per-row action inside the existing Edit dialog**, and when only one leg exists the counter leg is auto-generated after the user picks a destination account.

## Goal

Add a single "Merge as transfer" action inside the Edit Transaction dialog that, for rows with `transferId != null && type != TRANSFER`, converts the state into a proper linked pair of TRANSFER rows using existing DB columns.

## Non-goals

- Merging rows that have no `transferId`.
- Batch UI (banner, bulk merge).
- Automatic/background pairing.
- Changes to the CSV importer (it stays as-is — it already sets `transferId`).

## Behavior matrix

| Pending row has | Counter leg exists (same `transferId`, different `id`) | Action UI | Backend action |
|---|---|---|---|
| `transferId` set | yes | Button: **"Merge with counter leg in <accountName>"**. One click. | Upgrade both rows to TRANSFER. |
| `transferId` set | no | Button: **"Create counter leg"** + account picker (required). | Upgrade this row to TRANSFER + insert counter leg as TRANSFER. |
| No `transferId` | n/a | No merge UI. Dialog shows a muted notice: *"No transfer id — delete and recreate as a transfer if needed."* | N/A. |
| Already TRANSFER | n/a | No merge UI. | N/A. |

## Approach — "upgrade in place" semantics

Balance invariant: at any point, `account.balance` equals the sum of signed amounts of all its transactions. This invariant holds today for pending-transfer rows (the INCOME already credited the destination account; the EXPENSE already debited the source account), and it must continue to hold after merge.

### Pair case (both legs present)
```
UPDATE transactions SET type = 'TRANSFER', category_id = NULL, updated_at = now()
WHERE id IN (:pendingId, :counterId) AND profile_id = :profileId
```
- `transferId` is already shared → keeps linking them.
- `accountId`, `amount`, `date`, `description`, `notes`, `isCleared` preserved.
- `createdAt` is preserved, so the existing direction-inference logic in `serializeTransactionsWithContext` (`transaction-serializer.ts:95-107` — earliest `createdAt` = OUTFLOW) keeps producing the right direction without any migration or flag.
- `categoryId` is cleared because TRANSFER rows are not categorized; this matters for pending rows that somehow picked up a category despite the importer skipping it (defensive).
- No balance math — balances are already correct.

### Orphan case (only the pending row exists)
Atomic transaction:
1. `UPDATE transactions SET type = 'TRANSFER', category_id = NULL, updated_at = now() WHERE id = :pendingId AND profile_id = :profileId`
2. Compute counter leg's type-specific amount sign: the pending row was INCOME ⇒ counter is the OUT side; pending was EXPENSE ⇒ counter is the IN side. Counter's stored `amount` is the same magnitude.
3. Validate the user-picked `counterAccountId` belongs to the profile and is not the pending row's `accountId`.
4. `INSERT` counter row: same `profileId`, `transferId`, `amount`, `date`, `description`, `notes`, `isCleared`; `type='TRANSFER'`; `accountId=<userPicked>`; `categoryId=NULL`; `createdAt` must be **strictly later** than the pending row's `createdAt`.
5. Apply balance delta **to the counter account only**:
   - If pending was EXPENSE (outflow from the pending account), the counter leg is the inflow → `counterAccount.balance += amount`.
   - If pending was INCOME (inflow to the pending account), the counter leg is the outflow → `counterAccount.balance -= amount`.
6. The pending row's balance impact on its own account is already correct (the EXPENSE already debited it / the INCOME already credited it). No change needed there.

### Why `createdAt` ordering matters
`serializeTransactionsWithContext` sorts a transfer group by `createdAt` ASC and assigns `OUTFLOW` to the first, `INFLOW` to the second. For the pair case, both rows have their original `createdAt` and were typically created in order (outflow first when imported as EXPENSE, inflow first when imported as INCOME — depends on which CSV was imported first). This is fine: whichever leg is older becomes OUTFLOW. In practice, for a CSV-imported pair, the first CSV uploaded = first `createdAt`. That's a reasonable user expectation.

For the orphan case, the new counter row must be strictly newer than the pending row (otherwise direction gets flipped). The service sets `createdAt = new Date()` which is later than any row already persisted.

### Edge case: counter found but on same account
If, by malformed data, both rows with the same `transferId` live on the same account, we refuse the merge with `SAME_ACCOUNT_TRANSFER` (matches existing `createTransfer` behavior).

### Edge case: more than 2 rows share `transferId`
Possible if a user re-imports the same CSV. We refuse with `AMBIGUOUS_TRANSFER_GROUP` and surface the count in the UI, telling the user to clean up duplicates. Don't silently merge two of N rows.

## Contracts

### New backend endpoint
```
POST /transactions/:id/merge-as-transfer
body:
  {
    counterAccountId?: string   // required if no counter leg is found; ignored otherwise
  }
response (200):
  { success: true, data: Transaction[] }   // the two merged TRANSFER rows, serialized
errors (4xx):
  400 NO_TRANSFER_ID              pending row has no transferId
  400 ALREADY_TRANSFER            pending row is already TRANSFER
  400 SAME_ACCOUNT_TRANSFER       counter row or chosen counter account equals source
  400 AMBIGUOUS_TRANSFER_GROUP    >2 rows share this transferId
  400 COUNTER_ACCOUNT_REQUIRED    orphan case without counterAccountId
  404 TRANSACTION_NOT_FOUND       :id does not exist or not in profile
  404 ACCOUNT_NOT_FOUND           counterAccountId not in profile
```

### Service method
In `TransactionsService`:
```ts
mergeAsTransfer(
  profileId: string,
  pendingId: string,
  opts?: { counterAccountId?: string }
): Promise<Transaction[]>
```
Wraps the logic above in a single DB transaction. Reuses `loadCategoryParentMap` + `serializeTransactions` for the response.

### Frontend — EditTransactionDialog

In `EditIncomeExpenseForm`:
- Compute `isPendingTransfer = transaction.type !== "TRANSFER" && !!transaction.transferId`.
- When true, render a `MergeTransferPanel` at the top of the form body (above the Account select).
- The panel has three rendering modes:
  - **Loading** — while querying for the counter leg.
  - **Pair found** — shows *"Merge with counter leg in **{counterAccountName}**"* + a primary `Merge` button.
  - **Orphan** — shows a `NativeSelect` of accounts (filtered to exclude the current row's account) + a primary `Create counter leg & merge` button (disabled until an account is picked).
- On success: toast *"Transfer merged"*, invalidate `transactionKeys.lists()` + `accountKeys.lists()`, close the dialog.
- On error: toast the server error message; dialog stays open.

### Frontend — counter-leg lookup
A new lightweight hook `useTransferCounterLeg(transferId: string, selfId: string)` that GETs `/transactions?transferId=<id>` (needs a new filter) and returns `counterLeg: Transaction | null | "ambiguous"`. To keep scope tight, we add `transferId` to the existing `TransactionQuerySchema` and service filter (one line each — `and(eq(transactions.transferId, filters.transferId))`). This filter is also useful for the future batch-banner feature.

## Testing plan

### API — `transactions.service.test.ts`
- Pair case: seed two rows with same `transferId`, call `mergeAsTransfer(firstId)`, assert both become TRANSFER, `transferId` unchanged, account balances unchanged, `categoryId` cleared.
- Orphan case (pending EXPENSE → creates INFLOW counter): seed one EXPENSE row with `transferId`, call with `counterAccountId`, assert two rows exist with same `transferId`, types TRANSFER, counter account balance increased by amount, source account balance unchanged.
- Orphan case (pending INCOME → creates OUTFLOW counter): symmetric.
- Error: call on row with no `transferId` → `NO_TRANSFER_ID`.
- Error: orphan case without `counterAccountId` → `COUNTER_ACCOUNT_REQUIRED`.
- Error: 3 rows share `transferId` → `AMBIGUOUS_TRANSFER_GROUP`.
- Error: counter account = source account → `SAME_ACCOUNT_TRANSFER`.
- Error: call on already-TRANSFER row → `ALREADY_TRANSFER`.

### Frontend
- Existing tests unaffected; new `MergeTransferPanel` gets a unit test covering the three render modes (no server, just shape).

## Rollout

Single PR. No migration. Additive backend route + field-additive changes to the existing list filter. Frontend gated purely on `transferId` presence, so rows imported before this feature (which have no `transferId`) simply never show the new UI — they'll show the type fallback label ("Income" / "Expense") instead.
