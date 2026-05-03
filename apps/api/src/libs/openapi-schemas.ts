import { z } from "@hono/zod-openapi";

// ---------------------------------------------------------------------------
// Reusable OpenAPI schema helpers
// ---------------------------------------------------------------------------

/** Wraps a data schema in the standard ApiResponse envelope */
export function apiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema,
  });
}

export const ErrorResponseSchema = z.object({
  success: z.boolean(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
  }),
});

export const IdParamSchema = z.object({
  id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
});

// ---------------------------------------------------------------------------
// Common entity schemas for OpenAPI documentation
// ---------------------------------------------------------------------------

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  icon: z.string().optional(),
  type: z.enum(["PERSONAL", "BUSINESS", "SHARED"]),
  currency: z.string(),
  dateFormat: z.string(),
  weekStart: z.enum(["SUNDAY", "MONDAY"]),
  timezone: z.string(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  isSetupComplete: z.boolean(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AccountSchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  name: z.string(),
  group: z.enum([
    "chequing", "savings", "cash", "credit_card",
    "investment", "loan", "mortgage", "asset", "other",
  ]),
  balance: z.string(),
  currency: z.string(),
  institutionName: z.string().nullable().optional(),
  accountNumber: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  originalAmount: z.string().nullable().optional(),
  interestRate: z.string().nullable().optional(),
  creditLimit: z.string().nullable().optional(),
  linkedAccountId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  isActive: z.boolean(),
  includeInNetWorth: z.boolean(),
  sortOrder: z.number(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CategorySchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  name: z.string(),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CategoryWithSubcategoriesSchema = CategorySchema.extend({
  subcategories: z.array(CategorySchema).optional(),
});

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  accountId: z.string().uuid(),
  linkedAccountId: z.string().uuid().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  subcategoryId: z.string().uuid().nullable().optional(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  direction: z.enum(["INFLOW", "OUTFLOW"]),
  amount: z.string(),
  signedAmount: z.string(),
  description: z.string().optional(),
  notes: z.string().optional(),
  date: z.string(),
  transferId: z.string().uuid().nullable().optional(),
  linkedTransactionId: z.string().uuid().nullable().optional(),
  isCleared: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
