import { accounts, transactions } from "@workspace/db";
import type {
  Transaction,
  TransactionQuery,
  BulkCreateIncomeExpense,
  BulkImportResult,
  CreateIncomeExpense,
  CreateTransfer,
  UpdateIncomeExpense,
  UpdateTransfer,
} from "@workspace/types";

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
} from "./transaction-serializer.js";

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
    if (filters?.categoryId) {
      conditions.push(eq(transactions.categoryId, filters.categoryId));
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

    return {
      transactions: serializeTransactionsWithContext(rows, transferContextRows),
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

    if (transaction.type !== "TRANSFER" || !transaction.transferId) {
      return serializeTransaction(transaction);
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

    const [serialized] = serializeTransactions(pairedRows).filter(
      (row) => row.id === transaction.id
    );

    return (
      serialized ?? serializeTransaction(transaction, { direction: "OUTFLOW" })
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
          categoryId: payload.categoryId,
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

      return serializeTransaction(inserted);
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

          await tx.insert(transactions).values({
            profileId,
            accountId: item.accountId,
            categoryId: item.categoryId ?? null,
            type: item.type,
            amount: item.amount,
            description: item.description,
            notes: item.notes,
            date: item.date,
            isCleared: item.isCleared,
          });

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
      } catch (err) {
        errors.push({
          index: i,
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return { imported, failed: errors.length, errors };
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
      if (payload.categoryId !== undefined)
        updates.categoryId = payload.categoryId;
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

      return serializeTransaction(updated);
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
}

export const transactionsService = new TransactionsService();
