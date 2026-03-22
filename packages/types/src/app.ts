import z from "zod";

export type TimeGrain = "daily" | "weekly" | "monthly" | "yearly" | "all";

export type DateRange = {
  from: Date;
  to: Date;
};

export type DateNavDirections = "prev" | "next";

export const AccountTypeEnum = z.enum([
  "CHEQUING",
  "SAVINGS",
  "CREDIT_CARD",
  "RRSP",
  "FHSA",
  "RESP",
  "TFSA",
  "NON_REGISTERED",
]);
export type AccountType = z.infer<typeof AccountTypeEnum>;

export const TransactionTypeSchema = z.enum(["income", "expense", "transfer"]);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const CategoryTypeEnum = z.enum(["INCOME", "EXPENSE"]);
