import z from "zod";
import {
  AccountTypeEnum,
  CategoryTypeEnum,
  TransactionTypeSchema,
} from "./app.js";

// ============================================================================
// Profile Schemas
// ============================================================================

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().max(50).nullable(),
  lastName: z.string().max(50).nullable(),
  name: z.string().min(1).max(100),
  icon: z.string().max(10).nullable(),
  description: z.string().nullable(),
  currency: z.enum(["USD", "CAD", "GBP"]).default("CAD"),
  dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]).default("MM/DD/YYYY"),
  aiAssistantEnabled: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  isSetupComplete: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const InsertProfileSchema = ProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  firstName: true,
  lastName: true,
  icon: true,
  description: true,
  currency: true,
  dateFormat: true,
  aiAssistantEnabled: true,
  isDefault: true,
  isSetupComplete: true,
  isActive: true,
});

export const UpdateProfileSchema = InsertProfileSchema.partial();

export type Profile = z.infer<typeof ProfileSchema>;
export type InsertProfile = z.infer<typeof InsertProfileSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;

// ============================================================================
// Category Schemas
// ============================================================================

export const CategorySchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: CategoryTypeEnum,
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable(),
  icon: z.string().max(50).nullable(),
  parentId: z.string().uuid().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Note: profileId is injected by middleware from X-Profile-Id header
export const InsertCategorySchema = CategorySchema.omit({
  id: true,
  profileId: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  color: true,
  icon: true,
  parentId: true,
  sortOrder: true,
  isActive: true,
});

export const UpdateCategorySchema = InsertCategorySchema.partial();

export type Category = z.infer<typeof CategorySchema>;
export type InsertCategory = z.infer<typeof InsertCategorySchema>;
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;

// ============================================================================
// Account Schemas
// ============================================================================

export const AccountSchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: AccountTypeEnum,
  balance: z.number().default(0),
  currency: z.string().length(3).default("CAD"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable(),
  icon: z.string().max(50).nullable(),
  isActive: z.boolean().default(true),
  notes: z.string().max(500).nullable(),
  // For credit cards: the default account used to pay off this card
  defaultPaymentAccountId: z.string().uuid().nullable(),
  sortOrder: z.number().int().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Note: profileId is injected by middleware from X-Profile-Id header
export const InsertAccountSchema = AccountSchema.omit({
  id: true,
  profileId: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  balance: true,
  currency: true,
  color: true,
  icon: true,
  isActive: true,
  notes: true,
  defaultPaymentAccountId: true,
  sortOrder: true,
});

export const UpdateAccountSchema = InsertAccountSchema.partial();

export type Account = z.infer<typeof AccountSchema>;
export type InsertAccount = z.infer<typeof InsertAccountSchema>;
export type UpdateAccount = z.infer<typeof UpdateAccountSchema>;

// ============================================================================
// Transaction Schemas
// ============================================================================

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  accountId: z.string().uuid(),
  categoryId: z.string().uuid().nullable(),
  type: TransactionTypeSchema,
  amount: z.number(),
  description: z.string().min(1).max(200),
  notes: z.string().max(1000).nullable(),
  date: z.date(),
  // For transfers
  toAccountId: z.string().uuid().nullable(),
  // Additional metadata
  tags: z.array(z.string()).default([]),
  receiptUrl: z.string().url().nullable(),
  isReconciled: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Note: profileId is injected by middleware from X-Profile-Id header
export const InsertTransactionSchema = TransactionSchema.omit({
  id: true,
  profileId: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  categoryId: true,
  notes: true,
  toAccountId: true,
  tags: true,
  receiptUrl: true,
  isReconciled: true,
});

export const UpdateTransactionSchema = InsertTransactionSchema.partial();

export type Transaction = z.infer<typeof TransactionSchema>;
export type InsertTransaction = z.infer<typeof InsertTransactionSchema>;
export type UpdateTransaction = z.infer<typeof UpdateTransactionSchema>;

// ============================================================================
// Budget Schemas
// ============================================================================

export const BudgetSchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amount: z.number(),
  period: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]),
  startDate: z.date(),
  endDate: z.date().nullable(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const InsertBudgetSchema = BudgetSchema.omit({
  id: true,
  profileId: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  endDate: true,
  isActive: true,
});

export const UpdateBudgetSchema = InsertBudgetSchema.partial();

export type Budget = z.infer<typeof BudgetSchema>;
export type InsertBudget = z.infer<typeof InsertBudgetSchema>;
export type UpdateBudget = z.infer<typeof UpdateBudgetSchema>;

// ============================================================================
// Query Schemas (for API endpoints)
// ============================================================================

export const CategoryQuerySchema = z.object({
  type: CategoryTypeEnum.optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().uuid().optional().nullable(),
});

export const AccountQuerySchema = z.object({
  type: AccountTypeEnum.optional(),
  isActive: z.boolean().optional(),
});

export const TransactionQuerySchema = z.object({
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  type: TransactionTypeSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const BudgetQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  period: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]).optional(),
  isActive: z.boolean().optional(),
});

export type CategoryQuery = z.infer<typeof CategoryQuerySchema>;
export type AccountQuery = z.infer<typeof AccountQuerySchema>;
export type TransactionQuery = z.infer<typeof TransactionQuerySchema>;
export type BudgetQuery = z.infer<typeof BudgetQuerySchema>;
