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
  TransactionFinancialHealthCard,
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

  const transactions = useMemo(() => data?.transactions ?? [], [data]);
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

  const hasActiveFilters = activeFilterCount > 0;
  const filtersDisabled = transactions.length === 0 && !hasActiveFilters;

  return (
    <div className="flex w-full gap-4">
      <div className="flex w-full max-w-2xl flex-col gap-4 md:max-w-xl">
        {/* Row 1: global date range */}
        <DateRangeFilter />

        <Card>
          <CardContent>
            {/* Row 2: desktop filters */}
            <TransactionFilters disabled={filtersDisabled} />
          </CardContent>
        </Card>

        <AccountScopeBanner
          accountIds={filterState.accountIds}
          onClear={() => setFilters({ accountIds: undefined })}
        />

        {transactions.length === 0 ? (
          <div className="mx-auto my-auto mt-32 flex w-full flex-col gap-3">
            {hasActiveFilters ? (
              <FilteredEmpty onReset={resetFilters} />
            ) : (
              <EmptyTransactions
                openCreateTransaction={setOpenCreateTransaction}
              />
            )}
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            categoryMap={categoryMap}
            accountMap={accountMap}
            onEditTransaction={setEditTx}
          />
        )}

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

      <div className="grid min-w-80 flex-1 grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] items-start gap-4">
        <TransactionTotals
          income={summary.income}
          expenses={summary.expenses}
          net={summary.net}
        />
        <TransactionFinancialHealthCard
          income={summary.income}
          expenses={summary.expenses}
          currency={currency}
        />
        <AccountActivityCard accounts={summary.accounts} />
        <SpendingByCategoryCard categories={summary.categories} />
      </div>
    </div>
  );
}
