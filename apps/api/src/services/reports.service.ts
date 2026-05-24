import { categories, transactions } from "@workspace/db";
import type {
  CashflowMonthlyResponse,
  CategoryTotalsQuery,
  CategoryTotalsResponse,
} from "@workspace/types";

import { and, db, eq, gte, inArray, lte, sql } from "../libs/db.js";

export class ReportsService {
  async getCategoryTotals(
    profileId: string,
    filters: CategoryTotalsQuery
  ): Promise<CategoryTotalsResponse> {
    const conditions = [
      eq(transactions.profileId, profileId),
      eq(transactions.type, filters.type),
    ];

    if (filters.startDate) {
      conditions.push(gte(transactions.date, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(transactions.date, filters.endDate));
    }

    if (filters.accountId) {
      conditions.push(eq(transactions.accountId, filters.accountId));
    }

    const rows = await db
      .select({
        categoryId: transactions.categoryId,
        categoryName: sql<string>`COALESCE(${categories.name}, 'Uncategorized')`,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
        total: sql<string>`CAST(SUM(CAST(${transactions.amount} AS REAL)) AS TEXT)`,
        transactionCount: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .groupBy(transactions.categoryId)
      .orderBy(sql`SUM(CAST(${transactions.amount} AS REAL)) DESC`);

    // Compute grand total and percentages
    const grandTotal = rows.reduce((sum, row) => sum + Number(row.total), 0);

    const items = rows.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      categoryIcon: row.categoryIcon,
      categoryColor: row.categoryColor,
      total: row.total,
      percentage:
        grandTotal > 0
          ? Math.round((Number(row.total) / grandTotal) * 10000) / 100
          : 0,
      transactionCount: row.transactionCount,
    }));

    return {
      items,
      grandTotal: String(grandTotal),
    };
  }

  async getCashflowMonthly(
    profileId: string
  ): Promise<CashflowMonthlyResponse> {
    const now = new Date();
    const startYear = now.getUTCFullYear();
    const startMonth = now.getUTCMonth() - 11;
    const start = new Date(Date.UTC(startYear, startMonth, 1));
    const startDate = start.toISOString().slice(0, 10); // YYYY-MM-DD

    const rows = await db
      .select({
        month: sql<string>`strftime('%Y-%m', ${transactions.date})`,
        type: transactions.type,
        total: sql<string>`CAST(SUM(CAST(${transactions.amount} AS REAL)) AS TEXT)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.profileId, profileId),
          inArray(transactions.type, ["INCOME", "EXPENSE"]),
          gte(transactions.date, startDate)
        )
      )
      .groupBy(sql`strftime('%Y-%m', ${transactions.date})`, transactions.type);

    const buckets = new Map<string, { income: number; expense: number }>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(Date.UTC(startYear, startMonth + i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      buckets.set(key, { income: 0, expense: 0 });
    }

    for (const row of rows) {
      const bucket = buckets.get(row.month);
      if (!bucket) continue;
      const value = Number(row.total) || 0;
      if (row.type === "INCOME") bucket.income = value;
      else if (row.type === "EXPENSE") bucket.expense = value;
    }

    const items = Array.from(buckets.entries()).map(([month, b]) => ({
      month,
      income: String(b.income),
      expense: String(b.expense),
    }));

    return { items };
  }
}

export const reportsService = new ReportsService();
