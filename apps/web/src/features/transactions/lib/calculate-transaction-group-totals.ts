import type { Transaction } from "@workspace/types";

export interface TransactionGroupTotals {
  income: number;
  debit: number;
}

/**
 * Calculate income/debit totals for a group of transactions.
 * Transfers are intentionally excluded from both totals.
 */
export function calculateTransactionGroupTotals(
  transactions: Transaction[]
): TransactionGroupTotals {
  let income = 0;
  let debit = 0;

  for (const tx of transactions) {
    if (tx.type === "TRANSFER") continue;

    const amount = Number(tx.amount);
    const magnitude = Number.isFinite(amount)
      ? amount
      : Math.abs(Number(tx.signedAmount));

    if (!Number.isFinite(magnitude)) continue;

    if (tx.direction === "INFLOW") {
      income += magnitude;
    } else {
      debit += magnitude;
    }
  }

  return { income, debit };
}
