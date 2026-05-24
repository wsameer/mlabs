import { Fragment, useMemo } from "react";
import type { Transaction } from "@workspace/types";

import { formatCurrency } from "@/features/accounts/lib/format-utils";
import { parseDateString } from "@/lib/timezone";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
} from "@workspace/ui/components/item";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { format } from "date-fns";
import { TransactionItem } from "../../components/TransactionItem";
import { Separator } from "@workspace/ui/components/separator";
import { groupByDate } from "../../lib/group-by-date";
import { calculateTransactionGroupTotals } from "../../lib/calculate-transaction-group-totals";

type TransactionCategoryLookup = Map<
  string,
  { name: string; icon?: string; color?: string; parentId?: string | null }
>;

type TransactionAccountLookup = Map<string, string>;
type TransactionGroupTotals = { income: number; debit: number };

interface TransactionListProps {
  transactions: Transaction[];
  categoryMap: TransactionCategoryLookup;
  accountMap: TransactionAccountLookup;
  onEditTransaction: (transaction: Transaction) => void;
}

function getTransactionCategoryLabel({
  transaction,
  categoryName,
}: {
  transaction: Transaction;
  categoryName?: string;
}) {
  const isPendingTransfer =
    transaction.type !== "TRANSFER" && !!transaction.transferId;

  if (isPendingTransfer) {
    return transaction.type === "INCOME" ? "Transfer in" : "Transfer out";
  }

  if (transaction.type === "TRANSFER") {
    return transaction.direction === "OUTFLOW" ? "Transfer out" : "Transfer in";
  }

  return categoryName ?? (transaction.type === "INCOME" ? "Income" : "Expense");
}

function getTransactionMerchantSub({
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

export function TransactionList({
  transactions,
  categoryMap,
  accountMap,
  onEditTransaction,
}: TransactionListProps) {
  const { grouped, sortedDates, totalsByDate } = useMemo(() => {
    const groupedTransactions = groupByDate(transactions);
    const totals: Record<string, { income: number; debit: number }> = {};

    for (const dateKey of Object.keys(groupedTransactions)) {
      totals[dateKey] = calculateTransactionGroupTotals(
        groupedTransactions[dateKey]
      );
    }

    return {
      grouped: groupedTransactions,
      totalsByDate: totals,
      sortedDates: Object.keys(groupedTransactions).sort((a, b) =>
        b.localeCompare(a)
      ),
    };
  }, [transactions]);

  return (
    <Card className="p-0">
      <CardContent className="p-0">
        <ScrollArea className="h-[70svh]">
          <div>
            {sortedDates.map((date) => {
              const groupedTransactions = grouped[date];
              const totals = totalsByDate[date] ?? {
                income: 0,
                debit: 0,
              };

              return (
                <TransactionDateGroup
                  key={date}
                  date={date}
                  transactions={groupedTransactions}
                  totals={totals}
                  categoryMap={categoryMap}
                  accountMap={accountMap}
                  onEditTransaction={onEditTransaction}
                />
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function TransactionDateGroup({
  date,
  transactions,
  totals,
  categoryMap,
  accountMap,
  onEditTransaction,
}: {
  date: string;
  transactions: Transaction[];
  totals: TransactionGroupTotals;
  categoryMap: TransactionCategoryLookup;
  accountMap: TransactionAccountLookup;
  onEditTransaction: (transaction: Transaction) => void;
}) {
  return (
    <section>
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
        {transactions.map((transaction, index) => (
          <TransactionListItem
            key={transaction.id}
            transaction={transaction}
            isLast={transactions.length - 1 === index}
            categoryMap={categoryMap}
            accountMap={accountMap}
            onEditTransaction={onEditTransaction}
          />
        ))}
      </ItemGroup>
    </section>
  );
}

function TransactionListItem({
  transaction,
  isLast,
  categoryMap,
  accountMap,
  onEditTransaction,
}: {
  transaction: Transaction;
  isLast: boolean;
  categoryMap: TransactionCategoryLookup;
  accountMap: TransactionAccountLookup;
  onEditTransaction: (transaction: Transaction) => void;
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
  });
  const subcategoryName =
    transaction.type === "TRANSFER" || isPendingTransfer
      ? undefined
      : subcategory?.name;
  const merchantSub = getTransactionMerchantSub({
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
        merchantSub={merchantSub}
        amount={formattedAmount}
        type={transaction.type}
        onClick={() => onEditTransaction(transaction)}
        aria-label={`${transaction.type} ${transaction.description ?? ""} ${formattedAmount}`}
      />
      <Separator className="m-0" />
    </Fragment>
  );
}
