export type TransactionCategoryLookup = Map<
  string,
  { name: string; icon?: string; color?: string; parentId?: string | null }
>;

export type TransactionAccountLookup = Map<string, string>;

export type TransactionGroupTotals = { income: number; debit: number };
