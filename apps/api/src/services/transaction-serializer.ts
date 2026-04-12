import { transactions } from "@workspace/db";
import type { Transaction } from "@workspace/types";

export function serializeTransaction(
  transaction: typeof transactions.$inferSelect
): Transaction {
  return {
    ...transaction,
    categoryId: transaction.categoryId ?? undefined,
    description: transaction.description ?? undefined,
    notes: transaction.notes ?? undefined,
    transferId: transaction.transferId ?? undefined,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}
