import type { Transaction } from "@workspace/types";

export type TransactionCategoryMap = Map<
  string,
  { name: string; icon?: string; color?: string }
>;

export type TransactionAccountMap = Map<string, string>;

export interface TransactionsSummaryDataProps {
  transactions: Transaction[];
  categoryMap: TransactionCategoryMap;
  accountMap: TransactionAccountMap;
}

export interface CategoryBreakdown {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  total: number;
  percentage: number;
}

export interface AccountBreakdown {
  id: string;
  name: string;
  total: number;
  percentage: number;
}
