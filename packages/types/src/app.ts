export type TimeGrain = "daily" | "weekly" | "monthly" | "yearly" | "all";

export type DateRange = {
  from: Date;
  to: Date;
};

export type DateNavDirections = "prev" | "next";

export enum TransactionType {
  INCOME = "income",
  EXPENSE = "expense",
  TRANSFER = "bank_to_bank",
}