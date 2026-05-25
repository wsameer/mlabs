import { formatCurrency } from "@/features/accounts";
import type { Transaction } from "@workspace/types";
import {
  getTransactionCategoryLabel,
  getTransactionMerchantSub,
} from "../utils";
import { Fragment } from "react/jsx-runtime";
import { TransactionItem } from "@/features/transactions/components/TransactionItem";
import { Separator } from "@workspace/ui/components/separator";
import type {
  TransactionAccountLookup,
  TransactionCategoryLookup,
} from "../types";

export function TransactionListItem({
  transaction,
  isLast,
  categoryMap,
  accountMap,
  onEditTransaction,
  accountIdFilter,
}: {
  transaction: Transaction;
  isLast: boolean;
  categoryMap: TransactionCategoryLookup;
  accountMap: TransactionAccountLookup;
  onEditTransaction: (transaction: Transaction) => void;
  accountIdFilter?: string;
}) {
  const category = transaction.categoryId
    ? categoryMap.get(transaction.categoryId)
    : undefined;
  const subcategory = transaction.subcategoryId
    ? categoryMap.get(transaction.subcategoryId)
    : undefined;
  const accountName = accountMap.get(transaction.accountId) ?? "Unknown";
  const linkedAccountName = transaction.linkedAccountId
    ? (accountMap.get(transaction.linkedAccountId) ?? "Unknown")
    : undefined;
  const isPendingTransfer =
    transaction.type !== "TRANSFER" && !!transaction.transferId;
  const formattedAmount = formatCurrency(Number(transaction.signedAmount));

  const categoryName = getTransactionCategoryLabel({
    transaction,
    categoryName: category?.name,
    accountIdFilter,
  });

  console.log("🚀 categoryName ~ :", categoryName);

  const subcategoryName =
    transaction.type === "TRANSFER" || isPendingTransfer
      ? undefined
      : subcategory?.name;
  const accountsInvolved = getTransactionMerchantSub({
    transaction,
    accountName,
    linkedAccountName,
  });

  return (
    <Fragment>
      <TransactionItem
        className={isLast ? "rounded-t-none! rounded-b-sm" : "rounded-none!"}
        id={Number(transaction.id) || 0}
        category={categoryName}
        categorySub={subcategoryName}
        merchant={transaction.description || transaction.type.toLowerCase()}
        accountsInvolved={accountsInvolved}
        amount={formattedAmount}
        type={transaction.type}
        onClick={() => onEditTransaction(transaction)}
        aria-label={`${transaction.type} ${transaction.description ?? ""} ${formattedAmount}`}
      />
      <Separator className="m-0" />
    </Fragment>
  );
}
