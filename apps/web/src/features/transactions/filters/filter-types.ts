import { z } from "zod/v4";

export const TRANSACTION_FILTER_PRESETS = [
  "all",
  "uncategorized",
  "income",
  "expenses",
] as const;

export type TransactionFilterPreset =
  (typeof TRANSACTION_FILTER_PRESETS)[number];

export const TransactionsSearchSchema = z.object({
  preset: z.enum(TRANSACTION_FILTER_PRESETS).catch("all").default("all"),
  q: z.string().optional().catch(undefined),
  categoryIds: z.array(z.uuid()).optional().catch(undefined),
  accountIds: z.array(z.uuid()).optional().catch(undefined),
  minAmount: z.coerce.number().nonnegative().optional().catch(undefined),
  maxAmount: z.coerce.number().nonnegative().optional().catch(undefined),
});

export type TransactionFilterState = z.infer<typeof TransactionsSearchSchema>;

export const DEFAULT_TRANSACTION_FILTERS: TransactionFilterState = {
  preset: "all",
};
