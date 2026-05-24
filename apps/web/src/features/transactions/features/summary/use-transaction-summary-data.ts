import { useMemo } from "react";

import type {
  AccountBreakdown,
  CategoryBreakdown,
  TransactionsSummaryDataProps,
} from "./types";

export function useTransactionSummaryData({
  transactions,
  categoryMap,
  accountMap,
}: TransactionsSummaryDataProps) {
  return useMemo(() => {
    let income = 0;
    let expenses = 0;

    const categoryTotals = new Map<string, number>();
    const accountTotals = new Map<string, number>();

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
        expenses += magnitude;

        const categoryKey = tx.categoryId ?? "uncategorized";
        categoryTotals.set(
          categoryKey,
          (categoryTotals.get(categoryKey) ?? 0) + magnitude
        );
      }

      accountTotals.set(
        tx.accountId,
        (accountTotals.get(tx.accountId) ?? 0) + magnitude
      );
    }

    const categories: CategoryBreakdown[] = Array.from(categoryTotals.entries())
      .map(([id, total]) => {
        const category = categoryMap.get(id);
        return {
          id,
          name: category?.name ?? "Uncategorized",
          icon: category?.icon,
          color: category?.color,
          total,
          percentage: expenses > 0 ? Math.round((total / expenses) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    const totalActivity = income + expenses;
    const accounts: AccountBreakdown[] = Array.from(accountTotals.entries())
      .map(([id, total]) => ({
        id,
        name: accountMap.get(id) ?? "Unknown",
        total,
        percentage:
          totalActivity > 0 ? Math.round((total / totalActivity) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      income,
      expenses,
      net: income - expenses,
      categories,
      accounts,
    };
  }, [transactions, categoryMap, accountMap]);
}
