import { useMemo, useState } from "react";
import { BanknoteArrowUpIcon } from "lucide-react";
import type { Transaction } from "@workspace/types";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";

import { useLayoutConfig } from "@/features/layout";
import { TimeGrainSelect } from "@/components/TimeGrainSelect";
import { useUiActions } from "@/hooks/use-ui-store";
import { useTransactions } from "../api/use-transactions";
import { useAccounts } from "@/features/accounts/api/use-accounts";
import { useCategories } from "@/features/categories/api/use-categories";
import { formatCurrency } from "@/features/accounts/lib/format-utils";
import { TransactionItem } from "./TransactionItem";
import { TListLoader } from "./TListLoader";
import { EditTransactionDialog } from "./EditTransactionDialog";
import { DeleteTransactionDialog } from "./DeleteTransactionDialog";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Group transactions by date for display */
function groupByDate(transactions: Transaction[]): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    const key = tx.date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }
  return groups;
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyTransactions() {
  const { setOpenCreateTransaction } = useUiActions();

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BanknoteArrowUpIcon />
        </EmptyMedia>
        <EmptyTitle>No transactions found</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t added any transactions yet. Get started by adding an
          expense or income.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button onClick={() => setOpenCreateTransaction(true)}>
          Add a transaction
        </Button>
        <Tooltip>
          <TooltipTrigger
            render={<Button variant="outline">Import Transactions</Button>}
          />
          <TooltipContent>
            <p>Coming soon</p>
          </TooltipContent>
        </Tooltip>
      </EmptyContent>
    </Empty>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function TransactionsPage() {
  useLayoutConfig({
    pageTitle: "Transactions",
    actions: <TimeGrainSelect />,
  });

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
    const map = new Map<string, { name: string; icon?: string; parentId?: string | null }>();
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
        <EmptyTransactions />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {sortedDates.map((date) => {
        const txs = grouped[date];
        return (
          <section key={date}>
            <h3 className="sticky top-0 z-10 bg-background px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider text-muted-foreground uppercase">
              {formatDateLabel(date)}
            </h3>
            <ul className="flex flex-col divide-y divide-border">
              {txs.map((tx) => {
                const cat = tx.categoryId
                  ? categoryMap.get(tx.categoryId)
                  : undefined;
                const accountName = accountMap.get(tx.accountId) ?? "Unknown";
                const categoryName =
                  tx.type === "TRANSFER"
                    ? "Transfer"
                    : cat?.name ?? "Uncategorized";
                const sign: "credit" | "debit" =
                  tx.type === "INCOME" ? "credit" : "debit";

                return (
                  <TransactionItem
                    key={tx.id}
                    id={Number(tx.id) || 0}
                    category={categoryName}
                    categorySub={cat?.icon ?? undefined}
                    merchant={tx.description || tx.type.toLowerCase()}
                    merchantSub={accountName}
                    txDate={date}
                    amount={formatCurrency(Number(tx.amount))}
                    sign={sign}
                    onClick={() => setEditTx(tx)}
                    aria-label={`${tx.type} ${tx.description ?? ""} ${formatCurrency(Number(tx.amount))}`}
                  />
                );
              })}
            </ul>
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
