import { z } from "zod/v4";

export const IncomeExpenseFormSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().min(1, "Category is required"),
  subcategoryId: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().max(200).optional(),
  notes: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  isCleared: z.boolean().default(false),
});

export const TransferFormSchema = z
  .object({
    type: z.literal("TRANSFER"),
    fromAccountId: z.string().min(1, "Source account is required"),
    toAccountId: z.string().min(1, "Destination account is required"),
    amount: z.string().min(1, "Amount is required"),
    description: z.string().max(200).optional(),
    notes: z.string().optional(),
    date: z.string().min(1, "Date is required"),
    isCleared: z.boolean().default(false),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "Must be different from source account",
    path: ["toAccountId"],
  });

export type IncomeExpenseFormValues = z.infer<typeof IncomeExpenseFormSchema>;
export type TransferFormValues = z.infer<typeof TransferFormSchema>;
