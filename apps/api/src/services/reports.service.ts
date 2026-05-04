import { categories, transactions } from "@workspace/db";
import type {
  CategoryTotalsQuery,
  CategoryTotalsResponse,
} from "@workspace/types";

import { and, db, eq, gte, lte, sql } from "../libs/db.js";

export class ReportsService {
  async getCategoryTotals(
    profileId: string,
    filters: CategoryTotalsQuery
  ): Promise<CategoryTotalsResponse> {
    const conditions = [
      eq(transactions.profileId, profileId),
      eq(transactions.type, filters.type),
      gte(transactions.date, filters.startDate),
      lte(transactions.date, filters.endDate),
    ];

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
}

export const reportsService = new ReportsService();
