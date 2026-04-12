import { transactions } from "@workspace/db";
import type { Transaction, TransactionDirection } from "@workspace/types";

type TransactionRow = typeof transactions.$inferSelect;

function amountWithDirection(
  amount: string,
  direction: TransactionDirection
): string {
  const magnitude = amount.startsWith("-") ? amount.slice(1) : amount;
  return direction === "OUTFLOW" ? `-${magnitude}` : magnitude;
}

function inferDirection(
  transaction: TransactionRow,
  direction?: TransactionDirection
): TransactionDirection {
  if (direction) return direction;
  if (transaction.type === "INCOME") return "INFLOW";
  if (transaction.type === "EXPENSE") return "OUTFLOW";

  throw new Error(
    `Transfer direction is required for transaction ${transaction.id}`
  );
}

export function serializeTransaction(
  transaction: TransactionRow,
  options?: {
    direction?: TransactionDirection;
    linkedAccountId?: string;
    linkedTransactionId?: string;
  }
): Transaction {
  const direction = inferDirection(transaction, options?.direction);

  return {
    ...transaction,
    categoryId: transaction.categoryId ?? undefined,
    direction,
    description: transaction.description ?? undefined,
    linkedAccountId: options?.linkedAccountId,
    linkedTransactionId: options?.linkedTransactionId,
    notes: transaction.notes ?? undefined,
    signedAmount: amountWithDirection(transaction.amount, direction),
    transferId: transaction.transferId ?? undefined,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

export function serializeTransactions(rows: TransactionRow[]): Transaction[] {
  return serializeTransactionsWithContext(rows, rows);
}

export function serializeTransactionsWithContext(
  rows: TransactionRow[],
  transferContextRows: TransactionRow[]
): Transaction[] {
  const directionById = new Map<string, TransactionDirection>();
  const transferGroups = new Map<string, TransactionRow[]>();

  for (const row of transferContextRows) {
    if (row.type === "TRANSFER" && row.transferId) {
      const group = transferGroups.get(row.transferId) ?? [];
      group.push(row);
      transferGroups.set(row.transferId, group);
    }
  }

  for (const group of transferGroups.values()) {
    const sortedGroup = [...group].sort((left, right) => {
      const createdAtDiff =
        left.createdAt.getTime() - right.createdAt.getTime();

      if (createdAtDiff !== 0) return createdAtDiff;
      return left.id.localeCompare(right.id);
    });

    sortedGroup.forEach((row, index) => {
      directionById.set(row.id, index === 0 ? "OUTFLOW" : "INFLOW");
    });
  }

  return rows.map((row) =>
    {
      const transferGroup =
        row.type === "TRANSFER" && row.transferId
          ? transferGroups.get(row.transferId)
          : undefined;
      const linkedRow = transferGroup?.find(
        (candidate) => candidate.id !== row.id
      );

      return serializeTransaction(row, {
        direction: directionById.get(row.id),
        linkedAccountId: linkedRow?.accountId,
        linkedTransactionId: linkedRow?.id,
      });
    }
  );
}
