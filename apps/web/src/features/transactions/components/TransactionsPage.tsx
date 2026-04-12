import { useMemo, useState } from "react";
import type { Transaction } from "@workspace/types";

import { TimeGrainSelect } from "@/components/TimeGrainSelect";
import { useUiActions } from "@/hooks/use-ui-store";
import { useLayoutConfig } from "@/features/layout";
import { useAccounts } from "@/features/accounts/api/use-accounts";
import { useCategories } from "@/features/categories/api/use-categories";
import { formatCurrency } from "@/features/accounts/lib/format-utils";

import { useTransactions } from "../api/use-transactions";
import { TransactionItem } from "./TransactionItem";
import { TListLoader } from "./TListLoader";
import { EditTransactionDialog } from "./EditTransactionDialog";
import { DeleteTransactionDialog } from "./DeleteTransactionDialog";
import { EmptyTransactions } from "./EmptyTransactions";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "@workspace/ui/components/item";
import { format, getDate } from "date-fns";
import { Badge } from "@workspace/ui/components/badge";
import { calculateTransactionGroupTotals, groupByDate } from "../utils";
import { DateRangeFilter } from "@/components/DateRangeFilter";

export function TransactionsPage() {
  useLayoutConfig({
    pageTitle: "Transactions",
    actions: <TimeGrainSelect />,
  });

  const { setOpenCreateTransaction } = useUiActions();

  const { data, isLoading } = useTransactions();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);

  // Build lookup maps
  const accountMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts?.forEach((a) => map.set(a.id, a.name));
    return map;
  }, [accounts]);

  const categoryMap = useMemo(() => {
    const map = new Map<
      string,
      { name: string; icon?: string; parentId?: string | null }
    >();
    categories?.forEach((c) =>
      map.set(c.id, { name: c.name, icon: c.icon, parentId: c.parentId })
    );
    return map;
  }, [categories]);

  const transactions = useMemo(() => data?.transactions ?? [], [data]);
  const grouped = useMemo(() => groupByDate(transactions), [transactions]);
  const totalsByDate = useMemo(() => {
    const totals: Record<string, { income: number; debit: number }> = {};

    for (const dateKey of Object.keys(grouped)) {
      totals[dateKey] = calculateTransactionGroupTotals(grouped[dateKey]);
    }

    return totals;
  }, [grouped]);
  const sortedDates = useMemo(
    () => Object.keys(grouped).sort((a, b) => b.localeCompare(a)),
    [grouped]
  );

  if (isLoading) {
    return (
      <div className="mx-auto my-auto flex w-full flex-col gap-3 p-4">
        <TListLoader />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="mx-auto my-auto flex w-full flex-col gap-3">
        <EmptyTransactions openCreateTransaction={setOpenCreateTransaction} />
      </div>
    );
  }

  return (
    <div className="max-full flex flex-col gap-3">
      <DateRangeFilter />
      {sortedDates.map((date) => {
        const groupedTransactions = grouped[date];
        const totals = totalsByDate[date] ?? { income: 0, debit: 0 };

        return (
          <section
            key={date}
            className="w-full overflow-hidden rounded-md border"
          >
            <Item
              variant="outline"
              className="sticky top-0 z-10 mx-1 mt-1 w-auto px-2"
            >
              <ItemContent>
                <ItemTitle>
                  <Badge className="rounded-sm">{format(date, "EEE")}</Badge>
                  <p className="font-semibold">{getDate(date)}</p>
                </ItemTitle>
              </ItemContent>
              <ItemActions>
                <p className="w-16 text-end text-xs text-blue-600">
                  {formatCurrency(totals.income)}
                </p>
                <p className="w-16 text-end text-xs text-red-600">
                  {formatCurrency(totals.debit)}
                </p>
              </ItemActions>
            </Item>
            <ItemGroup className="flex flex-col gap-0 divide-y divide-border">
              {groupedTransactions.map((tx, index) => {
                const cat = tx.categoryId
                  ? categoryMap.get(tx.categoryId)
                  : undefined;
                const accountName = accountMap.get(tx.accountId) ?? "Unknown";
                const linkedAccountName = tx.linkedAccountId
                  ? (accountMap.get(tx.linkedAccountId) ?? "Unknown")
                  : undefined;
                const categoryName =
                  tx.type === "TRANSFER"
                    ? tx.direction === "OUTFLOW"
                      ? "Transfer out"
                      : "Transfer in"
                    : (cat?.name ?? "Uncategorized");
                const formattedAmount = formatCurrency(Number(tx.signedAmount));
                const merchantSub =
                  tx.type === "TRANSFER" && linkedAccountName
                    ? tx.direction === "OUTFLOW"
                      ? `${accountName} -> ${linkedAccountName}`
                      : `${linkedAccountName} -> ${accountName}`
                    : accountName;

                return (
                  <TransactionItem
                    key={tx.id}
                    className={
                      groupedTransactions.length - 1 === index
                        ? "rounded-t-none! rounded-b-sm"
                        : "rounded-none!"
                    }
                    id={Number(tx.id) || 0}
                    category={categoryName}
                    categorySub={cat?.icon ?? undefined}
                    merchant={tx.description || tx.type.toLowerCase()}
                    merchantSub={merchantSub}
                    amount={formattedAmount}
                    type={tx.type}
                    onClick={() => setEditTx(tx)}
                    aria-label={`${tx.type} ${tx.description ?? ""} ${formattedAmount}`}
                  />
                );
              })}
            </ItemGroup>
          </section>
        );
      })}

      <EditTransactionDialog
        open={!!editTx}
        onOpenChange={(open) => {
          if (!open) setEditTx(null);
        }}
        transaction={editTx}
        onDelete={(tx) => {
          setEditTx(null);
          setDeleteTx(tx);
        }}
      />

      <DeleteTransactionDialog
        open={!!deleteTx}
        onOpenChange={(open) => {
          if (!open) setDeleteTx(null);
        }}
        transaction={deleteTx}
      />
    </div>
  );
}
