export type AccountType =
  | "cash"
  | "investment"
  | "credit"
  | "chequing"
  | "savings"
  | "gic"
  | "other";

export const ACCOUNT_TYPES = [
  "cash",
  "investment",
  "credit",
  "chequing",
  "savings",
  "gic",
  "other",
] as const;

export interface AccountFormValues {
  name: string;
  balance: number;
  currency: string;
  // credit-only
  creditLimit?: number;
  // investment-only
  broker?: string;
}
