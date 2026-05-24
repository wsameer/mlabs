import { accounts, categories, transactions } from "@workspace/db";
import type {
  Transaction,
  TransactionQuery,
  BulkCreateIncomeExpense,
  BulkImportResult,
  CreateIncomeExpense,
  CreateTransfer,
  DetectedTransferRow,
  DetectTransfersResult,
  ApplyTransferMergesRequest,
  ApplyTransferMergesResult,
  UpdateIncomeExpense,
  UpdateTransfer,
} from "@workspace/types";

import { inArray, isNull, ne } from "drizzle-orm";

import { and, asc, db, desc, eq, gte, lte, or, sql } from "../libs/db.js";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "../libs/errors.js";
import {
  serializeTransaction,
  serializeTransactions,
  serializeTransactionsWithContext,
  type CategoryParentMap,
} from "./transaction-serializer.js";
import { matchTransfers, type MatcherCandidate } from "./transfer-matcher.js";

async function loadCategoryParentMap(
  profileId: string
): Promise<CategoryParentMap> {
  const rows = await db
    .select({ id: categories.id, parentId: categories.parentId })
    .from(categories)
    .where(eq(categories.profileId, profileId));
  return new Map(rows.map((r) => [r.id, r.parentId]));
}

export class TransactionsService {
  // ---------------------------------------------------------------------------
  // LIST
  // ---------------------------------------------------------------------------
  async listTransactions(
    profileId: string,
    filters?: TransactionQuery
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const conditions = [eq(transactions.profileId, profileId)];

    if (filters?.accountId) {
      conditions.push(eq(transactions.accountId, filters.accountId));
    }
    // uncategorizedOnly overrides categoryIds: a row cannot be both null and in a set.
    if (filters?.uncategorizedOnly) {
      conditions.push(isNull(transactions.categoryId));
      conditions.push(ne(transactions.type, "TRANSFER"));
    } else if (filters?.categoryIds && filters.categoryIds.length > 0) {
      conditions.push(inArray(transactions.categoryId, filters.categoryIds));
    }
    // pendingTransfersOnly: rows tagged with a transferId that have not yet
    // been upgraded to TYPE=TRANSFER (e.g. a bank export of one account where
    // the counter leg hasn't been imported yet).
    if (filters?.pendingTransfersOnly) {
      conditions.push(sql`${transactions.transferId} is not null`);
      conditions.push(ne(transactions.type, "TRANSFER"));
    }
    if (filters?.type) {
      conditions.push(eq(transactions.type, filters.type));
    }
    if (filters?.startDate) {
      conditions.push(gte(transactions.date, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(transactions.date, filters.endDate));
    }
    if (filters?.minAmount) {
      conditions.push(
        sql`CAST(${transactions.amount} AS REAL) >= CAST(${filters.minAmount} AS REAL)`
      );
    }
    if (filters?.maxAmount) {
      conditions.push(
        sql`CAST(${transactions.amount} AS REAL) <= CAST(${filters.maxAmount} AS REAL)`
      );
    }
    if (filters?.isCleared !== undefined) {
      conditions.push(eq(transactions.isCleared, filters.isCleared));
    }
    if (filters?.transferId) {
      conditions.push(eq(transactions.transferId, filters.transferId));
    }
    if (filters?.search?.trim()) {
      const search = `%${filters.search.trim().toLowerCase()}%`;
      conditions.push(sql`lower(${transactions.description}) like ${search}`);
    }

    const where = and(...conditions);

    // Sort
    const sortColumn =
      filters?.sortBy === "amount"
        ? sql`CAST(${transactions.amount} AS REAL)`
        : filters?.sortBy === "description"
          ? transactions.description
          : transactions.date;
    const sortDir = filters?.sortOrder === "asc" ? asc : desc;
    const orderBy = sortDir(sortColumn);

    // Count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(where);

    const total = countResult?.count ?? 0;

    // Fetch
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const rows = await db
      .select()
      .from(transactions)
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const transferIds = [
      ...new Set(
        rows
          .map((row) =>
            row.type === "TRANSFER" && row.transferId ? row.transferId : null
          )
          .filter((transferId): transferId is string => transferId !== null)
      ),
    ];

    const transferContextRows =
      transferIds.length === 0
        ? rows
        : await db
            .select()
            .from(transactions)
            .where(
              and(
                eq(transactions.profileId, profileId),
                or(
                  ...transferIds.map((transferId) =>
                    eq(transactions.transferId, transferId)
                  )
                )
              )
            );

    const categoryParentMap = await loadCategoryParentMap(profileId);

    return {
      transactions: serializeTransactionsWithContext(
        rows,
        transferContextRows,
        categoryParentMap
      ),
      total,
    };
  }

  // ---------------------------------------------------------------------------
  // GET BY ID
  // ---------------------------------------------------------------------------
  async getTransactionById(
    profileId: string,
    id: string
  ): Promise<Transaction> {
    const rows = await db
      .select()
      .from(transactions)
      .where(
        and(eq(transactions.id, id), eq(transactions.profileId, profileId))
      )
      .limit(1);

    const transaction = rows[0];
    if (!transaction) {
      throw new NotFoundError("Transaction not found", "TRANSACTION_NOT_FOUND");
    }

    const categoryParentMap = await loadCategoryParentMap(profileId);

    if (transaction.type !== "TRANSFER" || !transaction.transferId) {
      return serializeTransaction(transaction, { categoryParentMap });
    }

    const pairedRows = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.transferId, transaction.transferId),
          eq(transactions.profileId, profileId)
        )
      )
      .limit(2);

    const [serialized] = serializeTransactions(
      pairedRows,
      categoryParentMap
    ).filter((row) => row.id === transaction.id);

    return (
      serialized ??
      serializeTransaction(transaction, {
        direction: "OUTFLOW",
        categoryParentMap,
      })
    );
  }

  // ---------------------------------------------------------------------------
  // CREATE INCOME / EXPENSE
  // ---------------------------------------------------------------------------
  async createIncomeExpense(
    profileId: string,
    payload: CreateIncomeExpense
  ): Promise<Transaction> {
    return db.transaction(async (tx) => {
      // Validate account exists and belongs to profile
      const [account] = await tx
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.id, payload.accountId),
            eq(accounts.profileId, profileId)
          )
        )
        .limit(1);

      if (!account) {
        throw new NotFoundError("Account not found", "ACCOUNT_NOT_FOUND");
      }

      const [inserted] = await tx
        .insert(transactions)
        .values({
          profileId,
          accountId: payload.accountId,
          categoryId: payload.subcategoryId ?? payload.categoryId,
          type: payload.type,
          amount: payload.amount,
          description: payload.description,
          notes: payload.notes,
          date: payload.date,
          isCleared: payload.isCleared,
        })
        .returning();

      if (!inserted) {
        throw new InternalServerError(
          "Failed to create transaction",
          "TRANSACTION_CREATE_FAILED"
        );
      }

      // Update account balance
      const balanceDelta =
        payload.type === "INCOME"
          ? Number(payload.amount)
          : -Number(payload.amount);

      await tx
        .update(accounts)
        .set({
          balance: String(Number(account.balance) + balanceDelta),
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, payload.accountId));

      const categoryParentMap = await loadCategoryParentMap(profileId);
      return serializeTransaction(inserted, { categoryParentMap });
    });
  }

  // ---------------------------------------------------------------------------
  // BULK CREATE INCOME/EXPENSE (CSV import)
  // ---------------------------------------------------------------------------
  async bulkCreateIncomeExpense(
    profileId: string,
    items: BulkCreateIncomeExpense[]
  ): Promise<BulkImportResult> {
    let imported = 0;
    const errors: { index: number; message: string }[] = [];
    const importedTransferIds = new Set<string>();
    const importedIds: string[] = [];

    // Pre-validate: collect unique account IDs and verify they belong to profile
    const uniqueAccountIds = [...new Set(items.map((i) => i.accountId))];
    const validAccountIds = new Set<string>();

    for (const accountId of uniqueAccountIds) {
      const [account] = await db
        .select()
        .from(accounts)
        .where(
          and(eq(accounts.id, accountId), eq(accounts.profileId, profileId))
        )
        .limit(1);

      if (account) {
        validAccountIds.add(accountId);
      }
    }

    for (const [i, item] of items.entries()) {
      if (!validAccountIds.has(item.accountId)) {
        errors.push({ index: i, message: "Account not found" });
        continue;
      }

      try {
        await db.transaction(async (tx) => {
          const [account] = await tx
            .select()
            .from(accounts)
            .where(eq(accounts.id, item.accountId))
            .limit(1);

          if (!account) {
            throw new Error("Account not found");
          }

          const [inserted] = await tx
            .insert(transactions)
            .values({
              profileId,
              accountId: item.accountId,
              categoryId: item.subcategoryId ?? item.categoryId ?? null,
              type: item.type,
              amount: item.amount,
              description: item.description,
              notes: item.notes,
              date: item.date,
              isCleared: item.isCleared,
              transferId: item.transferId ?? null,
            })
            .returning({ id: transactions.id });
          if (inserted) importedIds.push(inserted.id);

          const balanceDelta =
            item.type === "INCOME" ? Number(item.amount) : -Number(item.amount);

          await tx
            .update(accounts)
            .set({
              balance: String(Number(account.balance) + balanceDelta),
              updatedAt: new Date(),
            })
            .where(eq(accounts.id, item.accountId));
        });

        imported++;
        if (item.transferId) importedTransferIds.add(item.transferId);
      } catch (err) {
        errors.push({
          index: i,
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const mergedTransfers = await this.sweepPendingTransferPairs(
      profileId,
      importedTransferIds
    );

    return {
      imported,
      failed: errors.length,
      mergedTransfers,
      importedIds,
      errors,
    };
  }

  // ---------------------------------------------------------------------------
  // SWEEP PENDING TRANSFER PAIRS
  // For each transferId touched by a bulk import, look across the whole profile
  // for a counter leg. When exactly two pending rows exist on different
  // accounts, upgrade both to TYPE=TRANSFER. Skip groups with 1 (still
  // pending) or 3+ (ambiguous — user resolves manually).
  // ---------------------------------------------------------------------------
  private async sweepPendingTransferPairs(
    profileId: string,
    transferIds: Set<string>
  ): Promise<number> {
    if (transferIds.size === 0) return 0;

    let merged = 0;

    for (const transferId of transferIds) {
      try {
        const upgraded = await db.transaction(async (tx) => {
          const group = await tx
            .select()
            .from(transactions)
            .where(
              and(
                eq(transactions.transferId, transferId),
                eq(transactions.profileId, profileId)
              )
            );

          if (group.length !== 2) return false;
          if (group.some((r) => r.type === "TRANSFER")) return false;
          if (group[0]!.accountId === group[1]!.accountId) return false;

          await tx
            .update(transactions)
            .set({
              type: "TRANSFER",
              categoryId: null,
              updatedAt: new Date(),
            })
            .where(
              and(
                inArray(
                  transactions.id,
                  group.map((r) => r.id)
                ),
                eq(transactions.profileId, profileId)
              )
            );

          return true;
        });

        if (upgraded) merged++;
      } catch {
        // Swallow per-group failures; the rows remain pending and the user
        // can merge them manually from the UI.
      }
    }

    return merged;
  }

  // ---------------------------------------------------------------------------
  // DETECT TRANSFER PAIRS (auto-detect heuristic for CSV import)
  // ---------------------------------------------------------------------------
  async detectTransferPairs(
    profileId: string,
    options: {
      scope: "all" | "ids";
      ids?: string[];
      dateToleranceDays?: number;
    }
  ): Promise<DetectTransfersResult> {
    const tolerance = options.dateToleranceDays ?? 1;

    // Load all non-TRANSFER rows for the profile — they're the candidate pool.
    // (Even when scope === "ids", a focal row's counter can be any older row,
    // so we still load the whole non-TRANSFER set.)
    const allRows = await db
      .select({
        id: transactions.id,
        accountId: transactions.accountId,
        type: transactions.type,
        amount: transactions.amount,
        date: transactions.date,
        description: transactions.description,
        transferId: transactions.transferId,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.profileId, profileId),
          ne(transactions.type, "TRANSFER")
        )
      );

    const candidates: MatcherCandidate[] = allRows.map((r) => ({
      id: r.id,
      accountId: r.accountId,
      type: r.type as "INCOME" | "EXPENSE",
      amount: r.amount,
      date: r.date,
      description: r.description ?? undefined,
      transferId: r.transferId ?? undefined,
    }));

    const { pairs, ambiguous } = matchTransfers(candidates, {
      dateToleranceDays: tolerance,
    });

    // When scope === "ids", restrict the output to pairs/ambiguities involving
    // the focal rows. (We still match against the whole pool above so cross-
    // import counters get found.)
    const focal =
      options.scope === "ids" && options.ids
        ? new Set(options.ids)
        : null;

    const filteredPairs = focal
      ? pairs.filter((p) => p.rowIds.some((id) => focal.has(id)))
      : pairs;
    const filteredAmbig = focal
      ? ambiguous.filter((a) => focal.has(a.rowId))
      : ambiguous;

    // Hydrate row summaries (account name + description).
    const accountIds = new Set<string>();
    for (const p of filteredPairs)
      for (const id of p.rowIds) {
        const row = candidates.find((c) => c.id === id);
        if (row) accountIds.add(row.accountId);
      }
    for (const a of filteredAmbig) {
      const focalRow = candidates.find((c) => c.id === a.rowId);
      if (focalRow) accountIds.add(focalRow.accountId);
      for (const cid of a.candidateIds) {
        const row = candidates.find((c) => c.id === cid);
        if (row) accountIds.add(row.accountId);
      }
    }

    const accountRows =
      accountIds.size === 0
        ? []
        : await db
            .select({ id: accounts.id, name: accounts.name })
            .from(accounts)
            .where(
              and(
                eq(accounts.profileId, profileId),
                inArray(accounts.id, [...accountIds])
              )
            );
    const accountNameById = new Map(
      accountRows.map((a) => [a.id, a.name])
    );

    const hydrate = (id: string): DetectedTransferRow | null => {
      const c = candidates.find((row) => row.id === id);
      if (!c) return null;
      return {
        id: c.id,
        accountId: c.accountId,
        accountName: accountNameById.get(c.accountId) ?? "Unknown account",
        type: c.type as "INCOME" | "EXPENSE",
        amount: c.amount,
        date: c.date,
        description: c.description ?? null,
      };
    };

    const hydratedPairs = filteredPairs.flatMap((p) => {
      const left = hydrate(p.rowIds[0]);
      const right = hydrate(p.rowIds[1]);
      if (!left || !right) return [];
      return [
        {
          id: p.id,
          confidence: p.confidence,
          rows: [left, right] as [DetectedTransferRow, DetectedTransferRow],
        },
      ];
    });

    const hydratedAmbig = filteredAmbig.flatMap((a) => {
      const focalRow = hydrate(a.rowId);
      if (!focalRow) return [];
      const cands = a.candidateIds
        .map(hydrate)
        .filter((c): c is DetectedTransferRow => c !== null);
      if (cands.length === 0) return [];
      return [{ id: a.id, row: focalRow, candidates: cands }];
    });

    return {
      pairs: hydratedPairs,
      ambiguous: hydratedAmbig,
      scanned: candidates.length,
    };
  }

  // ---------------------------------------------------------------------------
  // APPLY TRANSFER MERGES (user-confirmed pairs from auto-detect)
  // ---------------------------------------------------------------------------
  async applyTransferMerges(
    profileId: string,
    payload: ApplyTransferMergesRequest
  ): Promise<ApplyTransferMergesResult> {
    let merged = 0;
    const errors: { pairIndex: number; message: string }[] = [];

    for (const [index, pair] of payload.pairs.entries()) {
      try {
        const upgraded = await db.transaction(async (tx) => {
          const rows = await tx
            .select()
            .from(transactions)
            .where(
              and(
                eq(transactions.profileId, profileId),
                inArray(transactions.id, [pair.leftId, pair.rightId])
              )
            );

          if (rows.length !== 2) {
            throw new BadRequestError(
              "Pair rows not found",
              "PAIR_NOT_FOUND"
            );
          }
          if (rows.some((r) => r.type === "TRANSFER")) {
            throw new BadRequestError(
              "One or both rows are already a transfer",
              "ALREADY_TRANSFER"
            );
          }
          if (rows[0]!.accountId === rows[1]!.accountId) {
            throw new BadRequestError(
              "Both rows are on the same account",
              "SAME_ACCOUNT_TRANSFER"
            );
          }

          const sharedTransferId =
            rows[0]!.transferId ??
            rows[1]!.transferId ??
            crypto.randomUUID();

          await tx
            .update(transactions)
            .set({
              type: "TRANSFER",
              categoryId: null,
              transferId: sharedTransferId,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(transactions.profileId, profileId),
                inArray(transactions.id, [rows[0]!.id, rows[1]!.id])
              )
            );

          return true;
        });

        if (upgraded) merged++;
      } catch (err) {
        errors.push({
          pairIndex: index,
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return { merged, errors };
  }

  // ---------------------------------------------------------------------------
  // CREATE TRANSFER (double-entry)
  // ---------------------------------------------------------------------------
  async createTransfer(
    profileId: string,
    payload: CreateTransfer
  ): Promise<Transaction[]> {
    return db.transaction(async (tx) => {
      // Validate both accounts exist and belong to profile
      const [fromAccount] = await tx
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.id, payload.fromAccountId),
            eq(accounts.profileId, profileId)
          )
        )
        .limit(1);

      if (!fromAccount) {
        throw new NotFoundError(
          "Source account not found",
          "ACCOUNT_NOT_FOUND"
        );
      }

      const [toAccount] = await tx
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.id, payload.toAccountId),
            eq(accounts.profileId, profileId)
          )
        )
        .limit(1);

      if (!toAccount) {
        throw new NotFoundError(
          "Destination account not found",
          "ACCOUNT_NOT_FOUND"
        );
      }

      const transferId = crypto.randomUUID();

      // Outflow (from account)
      const [outflow] = await tx
        .insert(transactions)
        .values({
          profileId,
          accountId: payload.fromAccountId,
          type: "TRANSFER",
          amount: payload.amount,
          description: payload.description,
          notes: payload.notes,
          date: payload.date,
          isCleared: payload.isCleared,
          transferId,
        })
        .returning();

      // Inflow (to account)
      const [inflow] = await tx
        .insert(transactions)
        .values({
          profileId,
          accountId: payload.toAccountId,
          type: "TRANSFER",
          amount: payload.amount,
          description: payload.description,
          notes: payload.notes,
          date: payload.date,
          isCleared: payload.isCleared,
          transferId,
        })
        .returning();

      if (!outflow || !inflow) {
        throw new InternalServerError(
          "Failed to create transfer",
          "TRANSFER_CREATE_FAILED"
        );
      }

      // Update balances: deduct from source, add to destination
      const amount = Number(payload.amount);

      await tx
        .update(accounts)
        .set({
          balance: String(Number(fromAccount.balance) - amount),
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, payload.fromAccountId));

      await tx
        .update(accounts)
        .set({
          balance: String(Number(toAccount.balance) + amount),
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, payload.toAccountId));

      return serializeTransactions([outflow, inflow]);
    });
  }

  // ---------------------------------------------------------------------------
  // UPDATE INCOME / EXPENSE
  // ---------------------------------------------------------------------------
  async updateIncomeExpense(
    profileId: string,
    id: string,
    payload: UpdateIncomeExpense
  ): Promise<Transaction> {
    return db.transaction(async (tx) => {
      // Fetch existing transaction
      const [existing] = await tx
        .select()
        .from(transactions)
        .where(
          and(eq(transactions.id, id), eq(transactions.profileId, profileId))
        )
        .limit(1);

      if (!existing) {
        throw new NotFoundError(
          "Transaction not found",
          "TRANSACTION_NOT_FOUND"
        );
      }

      if (existing.type === "TRANSFER") {
        throw new BadRequestError(
          "Cannot update a transfer as income/expense. Delete and recreate instead.",
          "INVALID_TRANSACTION_TYPE"
        );
      }

      // Reverse old balance effect
      const oldDelta =
        existing.type === "INCOME"
          ? Number(existing.amount)
          : -Number(existing.amount);

      const [oldAccount] = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.id, existing.accountId))
        .limit(1);

      if (!oldAccount) {
        throw new NotFoundError("Account not found", "ACCOUNT_NOT_FOUND");
      }

      // If account is changing, validate the new one
      const newAccountId = payload.accountId ?? existing.accountId;
      let newAccount = oldAccount;

      if (payload.accountId && payload.accountId !== existing.accountId) {
        const [found] = await tx
          .select()
          .from(accounts)
          .where(
            and(
              eq(accounts.id, payload.accountId),
              eq(accounts.profileId, profileId)
            )
          )
          .limit(1);

        if (!found) {
          throw new NotFoundError("Account not found", "ACCOUNT_NOT_FOUND");
        }
        newAccount = found;
      }

      // Build updates
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (payload.accountId !== undefined)
        updates.accountId = payload.accountId;
      if (
        payload.categoryId !== undefined ||
        payload.subcategoryId !== undefined
      ) {
        updates.categoryId =
          payload.subcategoryId ?? payload.categoryId ?? null;
      }
      if (payload.amount !== undefined) updates.amount = payload.amount;
      if (payload.description !== undefined)
        updates.description = payload.description;
      if (payload.notes !== undefined) updates.notes = payload.notes;
      if (payload.date !== undefined) updates.date = payload.date;
      if (payload.isCleared !== undefined)
        updates.isCleared = payload.isCleared;

      const [updated] = await tx
        .update(transactions)
        .set(updates)
        .where(
          and(eq(transactions.id, id), eq(transactions.profileId, profileId))
        )
        .returning();

      if (!updated) {
        throw new InternalServerError(
          "Failed to update transaction",
          "TRANSACTION_UPDATE_FAILED"
        );
      }

      // Compute new balance effect
      const newAmount = payload.amount ?? existing.amount;
      const newType = existing.type; // type cannot change
      const newDelta =
        newType === "INCOME" ? Number(newAmount) : -Number(newAmount);

      if (newAccountId === existing.accountId) {
        // Same account: adjust by difference
        const diff = newDelta - oldDelta;
        if (diff !== 0) {
          await tx
            .update(accounts)
            .set({
              balance: String(Number(oldAccount.balance) + diff),
              updatedAt: new Date(),
            })
            .where(eq(accounts.id, existing.accountId));
        }
      } else {
        // Different account: reverse from old, apply to new
        await tx
          .update(accounts)
          .set({
            balance: String(Number(oldAccount.balance) - oldDelta),
            updatedAt: new Date(),
          })
          .where(eq(accounts.id, existing.accountId));

        await tx
          .update(accounts)
          .set({
            balance: String(Number(newAccount.balance) + newDelta),
            updatedAt: new Date(),
          })
          .where(eq(accounts.id, newAccountId));
      }

      const categoryParentMap = await loadCategoryParentMap(profileId);
      return serializeTransaction(updated, { categoryParentMap });
    });
  }

  // ---------------------------------------------------------------------------
  // UPDATE TRANSFER
  // ---------------------------------------------------------------------------
  async updateTransfer(
    profileId: string,
    id: string,
    payload: UpdateTransfer
  ): Promise<Transaction[]> {
    return db.transaction(async (tx) => {
      // Fetch the transaction being edited
      const [existing] = await tx
        .select()
        .from(transactions)
        .where(
          and(eq(transactions.id, id), eq(transactions.profileId, profileId))
        )
        .limit(1);

      if (!existing) {
        throw new NotFoundError(
          "Transaction not found",
          "TRANSACTION_NOT_FOUND"
        );
      }

      if (existing.type !== "TRANSFER" || !existing.transferId) {
        throw new BadRequestError(
          "Transaction is not a transfer",
          "INVALID_TRANSACTION_TYPE"
        );
      }

      // Find the paired transaction
      const [paired] = await tx
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.transferId, existing.transferId),
            eq(transactions.profileId, profileId),
            sql`${transactions.id} != ${id}`
          )
        )
        .limit(1);

      if (!paired) {
        throw new InternalServerError(
          "Paired transfer transaction not found",
          "TRANSFER_PAIR_NOT_FOUND"
        );
      }

      // Determine which is outflow (from) and which is inflow (to)
      // The one with the earlier created timestamp is the outflow (first inserted)
      const isExistingOutflow =
        existing.createdAt.getTime() <= paired.createdAt.getTime();
      const outflow = isExistingOutflow ? existing : paired;
      const inflow = isExistingOutflow ? paired : existing;

      // Fetch current accounts
      const [fromAccount] = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.id, outflow.accountId))
        .limit(1);
      const [toAccount] = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.id, inflow.accountId))
        .limit(1);

      if (!fromAccount || !toAccount) {
        throw new NotFoundError("Account not found", "ACCOUNT_NOT_FOUND");
      }

      const oldAmount = Number(existing.amount);

      // Reverse old balance effects
      await tx
        .update(accounts)
        .set({
          balance: String(Number(fromAccount.balance) + oldAmount),
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, outflow.accountId));

      await tx
        .update(accounts)
        .set({
          balance: String(Number(toAccount.balance) - oldAmount),
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, inflow.accountId));

      // Build shared updates
      const sharedUpdates: Record<string, unknown> = { updatedAt: new Date() };
      if (payload.amount !== undefined) sharedUpdates.amount = payload.amount;
      if (payload.description !== undefined)
        sharedUpdates.description = payload.description;
      if (payload.notes !== undefined) sharedUpdates.notes = payload.notes;
      if (payload.date !== undefined) sharedUpdates.date = payload.date;
      if (payload.isCleared !== undefined)
        sharedUpdates.isCleared = payload.isCleared;

      // Determine new account IDs
      const newFromAccountId = payload.fromAccountId ?? outflow.accountId;
      const newToAccountId = payload.toAccountId ?? inflow.accountId;

      if (newFromAccountId === newToAccountId) {
        throw new BadRequestError(
          "From and to accounts must be different",
          "SAME_ACCOUNT_TRANSFER"
        );
      }

      // Update outflow
      const [updatedOutflow] = await tx
        .update(transactions)
        .set({
          ...sharedUpdates,
          ...(payload.fromAccountId
            ? { accountId: payload.fromAccountId }
            : {}),
        })
        .where(eq(transactions.id, outflow.id))
        .returning();

      // Update inflow
      const [updatedInflow] = await tx
        .update(transactions)
        .set({
          ...sharedUpdates,
          ...(payload.toAccountId ? { accountId: payload.toAccountId } : {}),
        })
        .where(eq(transactions.id, inflow.id))
        .returning();

      if (!updatedOutflow || !updatedInflow) {
        throw new InternalServerError(
          "Failed to update transfer",
          "TRANSFER_UPDATE_FAILED"
        );
      }

      // Apply new balance effects
      const newAmount = Number(payload.amount ?? existing.amount);

      // Re-fetch accounts in case they changed
      const [newFromAccount] = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.id, newFromAccountId))
        .limit(1);
      const [newToAccount] = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.id, newToAccountId))
        .limit(1);

      if (!newFromAccount || !newToAccount) {
        throw new NotFoundError("Account not found", "ACCOUNT_NOT_FOUND");
      }

      await tx
        .update(accounts)
        .set({
          balance: String(Number(newFromAccount.balance) - newAmount),
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, newFromAccountId));

      await tx
        .update(accounts)
        .set({
          balance: String(Number(newToAccount.balance) + newAmount),
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, newToAccountId));

      return serializeTransactions([updatedOutflow, updatedInflow]);
    });
  }

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------
  async deleteTransaction(
    profileId: string,
    id: string
  ): Promise<Transaction[]> {
    return db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(transactions)
        .where(
          and(eq(transactions.id, id), eq(transactions.profileId, profileId))
        )
        .limit(1);

      if (!existing) {
        throw new NotFoundError(
          "Transaction not found",
          "TRANSACTION_NOT_FOUND"
        );
      }

      const deleted: Transaction[] = [];

      if (existing.type === "TRANSFER" && existing.transferId) {
        // Delete both sides of the transfer
        const transferRows = await tx
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.transferId, existing.transferId),
              eq(transactions.profileId, profileId)
            )
          );

        // Reverse balance for each side
        for (const row of transferRows) {
          const [account] = await tx
            .select()
            .from(accounts)
            .where(eq(accounts.id, row.accountId))
            .limit(1);

          if (account) {
            // Determine direction: the outflow (first created) had its balance decreased
            const isOutflow =
              row.createdAt.getTime() ===
              Math.min(...transferRows.map((r) => r.createdAt.getTime()));
            const reversal = isOutflow
              ? Number(row.amount)
              : -Number(row.amount);

            await tx
              .update(accounts)
              .set({
                balance: String(Number(account.balance) + reversal),
                updatedAt: new Date(),
              })
              .where(eq(accounts.id, row.accountId));
          }
        }

        // Delete all rows with this transferId
        const deletedRows = await tx
          .delete(transactions)
          .where(
            and(
              eq(transactions.transferId, existing.transferId),
              eq(transactions.profileId, profileId)
            )
          )
          .returning();

        deleted.push(...serializeTransactions(deletedRows));
      } else {
        // Single transaction: reverse balance and delete
        const [account] = await tx
          .select()
          .from(accounts)
          .where(eq(accounts.id, existing.accountId))
          .limit(1);

        if (account) {
          const reversal =
            existing.type === "INCOME"
              ? -Number(existing.amount)
              : Number(existing.amount);

          await tx
            .update(accounts)
            .set({
              balance: String(Number(account.balance) + reversal),
              updatedAt: new Date(),
            })
            .where(eq(accounts.id, existing.accountId));
        }

        const [deletedRow] = await tx
          .delete(transactions)
          .where(
            and(eq(transactions.id, id), eq(transactions.profileId, profileId))
          )
          .returning();

        if (!deletedRow) {
          throw new InternalServerError(
            "Failed to delete transaction",
            "TRANSACTION_DELETE_FAILED"
          );
        }

        deleted.push(serializeTransaction(deletedRow));
      }

      return deleted;
    });
  }

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

      const counterCreatedAt =
        pending.type === "INCOME"
          ? new Date(pending.createdAt.getTime() - 1)
          : new Date();

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
          createdAt: counterCreatedAt,
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
    });
  }
}

export const transactionsService = new TransactionsService();
