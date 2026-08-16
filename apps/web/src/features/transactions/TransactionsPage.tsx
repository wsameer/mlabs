import { useMemo, useState } from "react";
import type { Transaction } from "@workspace/types";

import { TimeGrainSelect } from "@/components/TimeGrainSelect";
import { ACCOUNTS_ROUTE } from "@/constants";
import { useUiActions } from "@/hooks/use-ui-store";
import { useLayoutConfig } from "@/features/layout";
import { useAccounts } from "@/features/accounts/api/use-accounts";
import { useCategories } from "@/features/categories/api/use-categories";

import { useTransactions } from "./api/use-transactions";
import { TListLoader } from "./components/TListLoader";
import { EmptyTransactions } from "./components/EmptyTransactions";
import { FilteredEmpty } from "./components/FilteredEmpty";
import {
  AccountActivityCard,
  DeleteTransactionDialog,
  EditTransactionDialog,
  SpendingByCategoryCard,
  TransactionTotals,
  useTransactionSummaryData,
} from "./features";
import { DateRangeFilter } from "@/features/filters/DateRangeFilter";
import { Card, CardContent } from "@workspace/ui/components/card";
import { useAppProfile } from "@/hooks/use-app";
import { useDateRange } from "@/hooks/use-filters";
import { toDateString } from "@/lib/timezone";
import {
  AccountScopeBanner,
  TransactionFilters,
  toApiQuery,
  useTransactionFilters,
} from "./filters";
import { TransactionList } from "./features/list/TransactionList";
import { FinancialHealthCard } from "../dashboard/components/FinancialHealthCard";

export function TransactionsPage() {
  const { to, from } = useDateRange();
  const { setOpenCreateTransaction } = useUiActions();
  const {
    filters: filterState,
    setFilters,
    resetFilters,
    activeFilterCount,
  } = useTransactionFilters();

  const queryFilters = useMemo(
    () =>
      toApiQuery(filterState, {
        startDate: toDateString(from),
        endDate: toDateString(to),
      }),
    [filterState, from, to]
  );

  const { data, isLoading } = useTransactions(queryFilters);
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const profile = useAppProfile();
  const currency = profile?.currency ?? "CAD";

  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);

  const accountMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts?.forEach((a) => map.set(a.id, a.name));
    return map;
  }, [accounts]);

  const categoryMap = useMemo(() => {
    const map = new Map<
      string,
      { name: string; icon?: string; color?: string; parentId?: string | null }
    >();
    categories?.forEach((c) => {
      map.set(c.id, {
        name: c.name,
        icon: c.icon,
        color: c.color,
        parentId: c.parentId,
      });
      c.subcategories?.forEach((sub) =>
        map.set(sub.id, {
          name: sub.name,
          icon: sub.icon,
          color: sub.color,
          parentId: sub.parentId,
        })
      );
    });
    return map;
  }, [categories]);

  const transactions = useMemo(() => {
    const raw = data?.transactions ?? [];

    // Separate transfers from non-transfers
    const transfers = raw.filter(
      (t) => t.type === "TRANSFER" && t.transferId != null
    );
    const nonTransfers = raw.filter((t) => t.type !== "TRANSFER");

    // Group transfers by transferId, then merge each pair into one
    const transferMap = transfers.reduce<Record<string, typeof transfers>>(
      (acc, t) => {
        (acc[t.transferId!] ??= []).push(t);
        return acc;
      },
      {}
    );

    const mergedTransfers = Object.values(transferMap).map((pair) => {
      if (pair.length !== 2) return pair[0]; // malformed pair, return as-is

      const filterAccountId = queryFilters?.accountId;

      if (filterAccountId) {
        // Keep whichever leg belongs to the filtered account
        const match = pair.find((t) => t.accountId === filterAccountId);
        const base = match ?? pair[0];
        return {
          ...base,
          type: (base.direction === "INFLOW" ? "INCOME" : "EXPENSE") as
            | "INCOME"
            | "EXPENSE",
        };
      } else {
        // No accountId filter — keep the INFLOW leg
        const inflow = pair.find((t) => t.direction === "INFLOW") ?? pair[0];
        return { ...inflow, type: "TRANSFER" as const };
      }
    });

    return [...nonTransfers, ...mergedTransfers];
  }, [data, queryFilters]);

  console.log("🚀 transactions ~ :", transactions);

  console.log("🚀 categoryMap ~ :", categoryMap);
  console.log("🚀 accountMap ~ :", accountMap);

  const summary = useTransactionSummaryData({
    transactions,
    categoryMap,
    accountMap,
  });

  const isAccountScoped = (filterState.accountIds?.length ?? 0) > 0;

  useLayoutConfig({
    pageTitle: "Transactions",
    actions: <TimeGrainSelect />,
    breadcrumbs: isAccountScoped
      ? [{ label: "Accounts", to: ACCOUNTS_ROUTE }, { label: "Transactions" }]
      : null,
  });

  if (isLoading) {
    return (
      <div className="mx-auto my-auto flex w-full flex-col gap-3 p-4">
        <TListLoader />
      </div>
    );
  }

  const hasNoTransaction = transactions.length === 0;
  const hasActiveFilters = activeFilterCount > 0;
  const filtersDisabled = hasNoTransaction && !hasActiveFilters;

  return (
    <>
      {/* Root: 2-column grid. Left takes 2/3, right takes 1/3 */}
      <div className="grid h-[calc(100svh-4.5rem)] w-full min-w-0 grid-cols-[2fr_1fr] gap-3 overflow-hidden p-0.5">
        {/* LEFT: inner 60/40 grid */}
        <div className="grid min-h-0 grid-cols-[3fr_2fr] gap-3 overflow-hidden">
          {/* LEFT-LEFT: 60% — filters + transaction list */}
          <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
            <div className="shrink-0">
              <DateRangeFilter />
            </div>
            <Card className="min-w-0 shrink-0">
              <CardContent>
                <TransactionFilters disabled={filtersDisabled} />
              </CardContent>
            </Card>
            <AccountScopeBanner
              accountIds={filterState.accountIds}
              onClear={() => setFilters({ accountIds: undefined })}
            />
            {hasNoTransaction ? (
              <div className="flex w-full min-w-0 flex-col gap-3">
                <Card>
                  <CardContent>
                    {hasActiveFilters ? (
                      <FilteredEmpty onReset={resetFilters} />
                    ) : (
                      <EmptyTransactions
                        openCreateTransaction={setOpenCreateTransaction}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <TransactionList
                transactions={transactions}
                categoryMap={categoryMap}
                accountMap={accountMap}
                onEditTransaction={setEditTx}
                accountIdFilter={queryFilters.accountId}
              />
            )}
          </div>

          {/* LEFT-RIGHT: 40% — totals + spending */}
          <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
            <TransactionTotals
              income={summary.income}
              expenses={summary.expenses}
              net={summary.net}
            />
            <SpendingByCategoryCard categories={summary.categories} />
          </div>
        </div>

        {/* RIGHT: 1fr — financial health + account activity, content-sized with scroll cap */}
        <div className="flex max-h-[calc(100svh-4.5rem-1rem)] w-full min-w-0 flex-col gap-3 self-start overflow-y-auto p-0.5">
          <FinancialHealthCard
            income={summary.income}
            expenses={summary.expenses}
            currency={currency}
            className="min-w-0 shrink-0"
            disclaimer="Based on income and expenses in this transaction view."
          />
          <AccountActivityCard accounts={summary.accounts} />
        </div>
      </div>

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
    </>
  );
}
