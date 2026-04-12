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
import { ItemGroup } from "@workspace/ui/components/item";
import { Separator } from "@workspace/ui/components/separator";
import { format } from "date-fns";
import { Badge } from "@workspace/ui/components/badge";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Group transactions by date for display */
function groupByDate(
  transactions: Transaction[]
): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    const key = tx.date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

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

  const transactions = data?.transactions ?? [];
  const grouped = useMemo(() => groupByDate(transactions), [transactions]);
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
    <div className="flex w-full flex-col gap-3">
      {sortedDates.map((date) => {
        const groupedTransactions = grouped[date];

        return (
          <section key={date} className="rounded-md border">
            <div className="sticky flex items-center justify-between px-2 py-1.5">
              <h3 className="z-10 flex flex-2 items-center gap-2 text-[0.65rem] font-semibold tracking-wider text-muted-foreground uppercase">
                <Badge>{format(date, "EEE")}</Badge>
                {format(date, "MMM d, yyyy")}
              </h3>
              <p className="flex-1 text-end text-xs">$1000</p>
              <p className="flex-1 text-end text-xs">$1000</p>
            </div>
            <ItemGroup className="flex flex-col gap-0 divide-y divide-border">
              {groupedTransactions.map((tx) => {
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
                const sign: "credit" | "debit" =
                  tx.direction === "INFLOW" ? "credit" : "debit";
                const formattedAmount = formatCurrency(Number(tx.signedAmount));
                const merchantSub =
                  tx.type === "TRANSFER" && linkedAccountName
                    ? tx.direction === "OUTFLOW"
                      ? `${accountName} -> ${linkedAccountName}`
                      : `${linkedAccountName} -> ${accountName}`
                    : accountName;

                return (
                  <>
                    <TransactionItem
                      key={tx.id}
                      id={Number(tx.id) || 0}
                      category={categoryName}
                      categorySub={cat?.icon ?? undefined}
                      merchant={tx.description || tx.type.toLowerCase()}
                      merchantSub={merchantSub}
                      txDate={date}
                      amount={formattedAmount}
                      sign={sign}
                      onClick={() => setEditTx(tx)}
                      aria-label={`${tx.type} ${tx.description ?? ""} ${formattedAmount}`}
                    />
                  </>
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
