import React, { useMemo, useState } from "react";
import type { Transaction } from "@workspace/types";

import { TimeGrainSelect } from "@/components/TimeGrainSelect";
import { useUiActions } from "@/hooks/use-ui-store";
import { useLayoutConfig } from "@/features/layout";
import { useAccounts } from "@/features/accounts/api/use-accounts";
import { useCategories } from "@/features/categories/api/use-categories";
import { formatCurrency } from "@/features/accounts/lib/format-utils";

import { useTransactions } from "./api/use-transactions";
import { TransactionItem } from "./components/TransactionItem";
import { TListLoader } from "./components/TListLoader";
import { EmptyTransactions } from "./components/EmptyTransactions";
import { FilteredEmpty } from "./components/FilteredEmpty";
import { EditTransactionDialog } from "./edit-transaction";
import { DeleteTransactionDialog } from "./delete-transaction";
import {
  TransactionsSummaryContent,
  TransactionsSummaryMobile,
} from "./summary";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
} from "@workspace/ui/components/item";
import { format } from "date-fns";
import { Badge } from "@workspace/ui/components/badge";
import { groupByDate } from "./lib/group-by-date";
import { calculateTransactionGroupTotals } from "./lib/calculate-transaction-group-totals";
import { DateRangeFilter } from "@/features/filters/DateRangeFilter";
import { Card, CardContent } from "@workspace/ui/components/card";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Separator } from "@workspace/ui/components/separator";
import { useDateRange } from "@/hooks/use-filters";
import { parseDateString, toDateString } from "@/lib/timezone";
import {
  SearchInput,
  TransactionFilters,
  TransactionFiltersDrawer,
  toApiQuery,
  useTransactionFilters,
} from "./filters";

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
    categories?.forEach((c) =>
      map.set(c.id, {
        name: c.name,
        icon: c.icon,
        color: c.color,
        parentId: c.parentId,
      })
    );
    return map;
  }, [categories]);

  const transactions = useMemo(() => data?.transactions ?? [], [data]);

  const sidebarContent = useMemo(
    () =>
      transactions.length > 0 ? (
        <TransactionsSummaryContent
          transactions={transactions}
          categoryMap={categoryMap}
          accountMap={accountMap}
        />
      ) : null,
    [transactions, categoryMap, accountMap]
  );

  useLayoutConfig({
    pageTitle: "Transactions",
    actions: <TimeGrainSelect />,
    leftSidebarContent: sidebarContent,
  });

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

  const hasActiveFilters = activeFilterCount > 0;
  const filtersDisabled = transactions.length === 0 && !hasActiveFilters;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4 md:max-w-xl">
      {/* Row 1: global date range */}
      <DateRangeFilter />

      {/* Row 2: desktop filters */}
      <div className="hidden lg:block">
        <TransactionFilters disabled={filtersDisabled} />
      </div>

      {/* Row 2 (mobile): search + Filters sheet + summary */}
      <div className="flex items-center gap-2 lg:hidden">
        <SearchInput
          value={filterState.q ?? ""}
          onDebouncedChange={(next) =>
            setFilters({ q: next.length > 0 ? next : undefined })
          }
          disabled={filtersDisabled}
          className="min-w-0 flex-1"
        />
        <TransactionFiltersDrawer disabled={filtersDisabled} />
        <TransactionsSummaryMobile
          transactions={transactions}
          categoryMap={categoryMap}
          accountMap={accountMap}
        />
      </div>

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
        <Card className="p-0">
          <CardContent className="p-0">
            <ScrollArea className="h-[75svh]">
              <div className="pb-12 sm:pb-0">
                {sortedDates.map((date) => {
                  const groupedTransactions = grouped[date];
                  const totals = totalsByDate[date] ?? {
                    income: 0,
                    debit: 0,
                  };

                  return (
                    <section key={date}>
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
                        {groupedTransactions.map((tx, index) => {
                          const cat = tx.categoryId
                            ? categoryMap.get(tx.categoryId)
                            : undefined;
                          const accountName =
                            accountMap.get(tx.accountId) ?? "Unknown";
                          const linkedAccountName = tx.linkedAccountId
                            ? (accountMap.get(tx.linkedAccountId) ?? "Unknown")
                            : undefined;
                          const categoryName =
                            tx.type === "TRANSFER"
                              ? tx.direction === "OUTFLOW"
                                ? "Transfer out"
                                : "Transfer in"
                              : (cat?.name ?? "Uncategorized");
                          const formattedAmount = formatCurrency(
                            Number(tx.signedAmount)
                          );
                          const merchantSub =
                            tx.type === "TRANSFER" && linkedAccountName
                              ? tx.direction === "OUTFLOW"
                                ? `${accountName} -> ${linkedAccountName}`
                                : `${linkedAccountName} -> ${accountName}`
                              : accountName;

                          return (
                            <React.Fragment key={tx.id}>
                              <TransactionItem
                                className={
                                  groupedTransactions.length - 1 === index
                                    ? "rounded-t-none! rounded-b-sm"
                                    : "rounded-none!"
                                }
                                id={Number(tx.id) || 0}
                                category={categoryName}
                                categorySub={cat?.icon ?? undefined}
                                merchant={
                                  tx.description || tx.type.toLowerCase()
                                }
                                merchantSub={merchantSub}
                                amount={formattedAmount}
                                type={tx.type}
                                onClick={() => setEditTx(tx)}
                                aria-label={`${tx.type} ${tx.description ?? ""} ${formattedAmount}`}
                              />
                              <Separator className="m-0" />
                            </React.Fragment>
                          );
                        })}
                      </ItemGroup>
                    </section>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
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
  );
}
