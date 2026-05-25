import type { Transaction } from "@workspace/types";

export function getTransactionCategoryLabel({
  transaction,
  categoryName,
  accountIdFilter,
}: {
  transaction: Transaction;
  categoryName?: string;
  accountIdFilter?: string;
}) {
  const isPendingTransfer =
    transaction.type !== "TRANSFER" && !!transaction.transferId;

  if (isPendingTransfer) {
    return transaction.type === "INCOME" ? "Transfer in" : "Transfer out";
  }

  if (transaction.type === "TRANSFER") {
    if (!accountIdFilter) {
      return "Transfer";
    }
    return transaction.direction === "OUTFLOW" ? "Transfer out" : "Transfer in";
  }

  return categoryName ?? (transaction.type === "INCOME" ? "Income" : "Expense");
}

export function getTransactionMerchantSub({
  transaction,
  accountName,
  linkedAccountName,
}: {
  transaction: Transaction;
  accountName: string;
  linkedAccountName?: string;
}) {
  if (transaction.type !== "TRANSFER" || !linkedAccountName) {
    return accountName;
  }

  return transaction.direction === "OUTFLOW"
    ? `${accountName} -> ${linkedAccountName}`
    : `${linkedAccountName} -> ${accountName}`;
}
