import { z } from "zod/v4";
import {
  DateFormatSchema,
  FirstAccountSchema,
  WeekStartSchema,
  WorkspaceNameSchema,
  WorkspaceTypeSchema,
} from "./onboarding.js";

// ============================================================================
// Health Check
// ============================================================================

export const HealthCheckSchema = z.object({
  status: z.enum(["ok", "error"]),
  timestamp: z.string(),
  version: z.string().optional(),
  database: z.enum(["connected", "disconnected"]).optional(),
  responseTime: z.string().optional(),
  uptime: z.number().optional(),
  error: z.string().optional(),
});

export type HealthCheck = z.infer<typeof HealthCheckSchema>;

// ============================================================================
// Enums
// ============================================================================

export const ProfileTypeSchema = z.enum(["PERSONAL", "BUSINESS", "SHARED"]);
export type ProfileType = z.infer<typeof ProfileTypeSchema>;

export const AccountGroupSchema = z.enum([
  "chequing",
  "savings",
  "cash",
  "credit_card",
  "investment",
  "loan",
  "mortgage",
  "asset",
  "other",
]);
export type AccountGroup = z.infer<typeof AccountGroupSchema>;

export const CategoryTypeSchema = z.enum(["INCOME", "EXPENSE"]);
export type CategoryType = z.infer<typeof CategoryTypeSchema>;

export const TransactionTypeSchema = z.enum(["INCOME", "EXPENSE", "TRANSFER"]);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const TransactionDirectionSchema = z.enum(["INFLOW", "OUTFLOW"]);
export type TransactionDirection = z.infer<typeof TransactionDirectionSchema>;

// Re-export onboarding enums used as profile fields
export type DateFormat = z.infer<typeof DateFormatSchema>;
export type WeekStart = z.infer<typeof WeekStartSchema>;

// ============================================================================
// Profile / Workspace
// ============================================================================

export const ProfileSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(100),
  icon: z.string().max(10).optional(),
  type: ProfileTypeSchema.default("PERSONAL"),
  currency: z.string().length(3).default("CAD"),
  dateFormat: DateFormatSchema.default("D MMM, YYYY"),
  weekStart: WeekStartSchema.default("MONDAY"),
  timezone: z.string().default("America/Toronto"),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isSetupComplete: z.boolean().default(false),
  notes: z.string().max(160).optional(),
  createdAt: z.iso.date(),
  updatedAt: z.iso.date(),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const UpdateProfileSchema = z.object({
  icon: z.string().max(10).optional(),
  type: ProfileTypeSchema.optional(),
  currency: z.string().length(3).optional(),
  dateFormat: DateFormatSchema.optional(),
  weekStart: WeekStartSchema.optional(),
  notes: z
    .string()
    .transform((value) => value.slice(0, 160))
    .optional(),
});

export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;

export const ProfileParamsSchema = z.object({
  id: z.uuid(),
});

export type ProfileParams = z.infer<typeof ProfileParamsSchema>;

// ============================================================================
// Bootstrap
// ============================================================================

export const BootstrapStatusSchema = z.enum(["onboarding", "pick", "ready"]);

export const BootstrapSchema = z.object({
  status: BootstrapStatusSchema,
  profile: ProfileSchema.nullable().optional(),
  profiles: z.array(ProfileSchema).default([]),
  hasAccount: z.boolean().default(false),
});

export type Bootstrap = z.infer<typeof BootstrapSchema>;
export type BootstrapStatus = z.infer<typeof BootstrapStatusSchema>;

// ============================================================================
// Onboarding (API-specific)
// ============================================================================

export const OnboardingAccountSchema = FirstAccountSchema.refine(
  (value) => AccountGroupSchema.safeParse(value.group).success,
  {
    message: "Unsupported account group",
    path: ["group"],
  }
);

export type OnboardingAccount = z.infer<typeof OnboardingAccountSchema>;

export const CreateOnboardingProfileSchema = z.object({
  name: WorkspaceNameSchema,
  icon: z.string().max(10).optional(),
  type: WorkspaceTypeSchema.default("PERSONAL"),
  currency: z.string().length(3).default("CAD"),
  dateFormat: DateFormatSchema.default("D MMM, YYYY"),
  weekStart: WeekStartSchema.default("MONDAY"),
  timezone: z.string().min(1),
  firstAccount: OnboardingAccountSchema.optional(),
});

export type CreateOnboardingProfile = z.infer<
  typeof CreateOnboardingProfileSchema
>;

// ============================================================================
// Account
// ============================================================================

export const AccountSchema = z.object({
  id: z.uuid(),
  profileId: z.uuid(),
  name: z.string().min(1).max(100),
  group: AccountGroupSchema,
  balance: z.string(),
  currency: z.string().length(3).default("CAD"),
  institutionName: z.string().max(100).nullable().optional(),
  accountNumber: z.string().max(50).nullable().optional(),
  description: z.string().max(200).nullable().optional(),
  originalAmount: z.string().nullable().optional(),
  interestRate: z.string().nullable().optional(),
  creditLimit: z.string().nullable().optional(),
  linkedAccountId: z.uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/)
    .nullable()
    .optional(),
  icon: z.string().max(50).nullable().optional(),
  isActive: z.boolean().default(true),
  includeInNetWorth: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  notes: z.string().nullable().optional(),
  createdAt: z.iso.date(),
  updatedAt: z.iso.date(),
});

export type Account = z.infer<typeof AccountSchema>;

// API payload — profileId injected by middleware
export const CreateAccountSchema = AccountSchema.omit({
  id: true,
  profileId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.uuid().optional(),
  balance: z.string().optional(),
  originalAmount: z.string().optional(),
  interestRate: z.string().optional(),
});

export type CreateAccount = z.infer<typeof CreateAccountSchema>;

export const UpdateAccountSchema = CreateAccountSchema.partial();
export type UpdateAccount = z.infer<typeof UpdateAccountSchema>;

// ============================================================================
// Account Metadata Validation
// ============================================================================

import { AccountMetadataSchemas } from "./account-metadata.js";

export function validateAccountMetadata(
  group: string,
  metadata: unknown
): boolean {
  const schema =
    AccountMetadataSchemas[group as keyof typeof AccountMetadataSchemas];
  if (!schema) return false;
  return schema.safeParse(metadata).success;
}

// ============================================================================
// Category
// ============================================================================

export const CategorySchema = z.object({
  id: z.uuid(),
  profileId: z.uuid(),
  name: z.string().min(1).max(100),
  type: CategoryTypeSchema,
  icon: z.string().max(50).optional(),
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/)
    .optional(),
  parentId: z.uuid().nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  createdAt: z.iso.date(),
  updatedAt: z.iso.date(),
});

export type Category = z.infer<typeof CategorySchema>;

export const CategoryWithSubcategoriesSchema = CategorySchema.extend({
  subcategories: z.array(CategorySchema).optional(),
});

export type CategoryWithSubcategories = z.infer<
  typeof CategoryWithSubcategoriesSchema
>;

// API payload — profileId injected by middleware
export const CreateCategorySchema = CategorySchema.omit({
  id: true,
  profileId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.uuid().optional(),
});

export type CreateCategory = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = CreateCategorySchema.partial();
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;

// ============================================================================
// Transaction
// ============================================================================

export const TransactionSchema = z.object({
  id: z.uuid(),
  profileId: z.uuid(),
  accountId: z.uuid(),
  linkedAccountId: z.uuid().nullable().optional(),
  categoryId: z.uuid().nullable().optional(),
  type: TransactionTypeSchema,
  direction: TransactionDirectionSchema,
  amount: z.string(),
  signedAmount: z.string(),
  description: z.string().max(200).optional(),
  notes: z.string().optional(),
  date: z.string(),
  transferId: z.uuid().nullable().optional(),
  linkedTransactionId: z.uuid().nullable().optional(),
  isCleared: z.boolean().default(false),
  createdAt: z.iso.date(),
  updatedAt: z.iso.date(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

export const TransactionSummarySchema = TransactionSchema.pick({
  id: true,
  date: true,
  type: true,
  direction: true,
  amount: true,
  signedAmount: true,
  description: true,
  isCleared: true,
  transferId: true,
  linkedTransactionId: true,
}).extend({
  accountName: z.string(),
  categoryName: z.string().nullable(),
  categoryIcon: z.string().nullable(),
  categoryColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/)
    .optional(),
  subcategoryName: z.string().nullable().optional(),
  linkedAccountName: z.string().nullable().optional(),
});

export type TransactionSummary = z.infer<typeof TransactionSummarySchema>;

// API payloads — profileId injected by middleware

// Base fields shared by all transaction types
const TransactionBaseSchema = z.object({
  amount: z.string(),
  description: z.string().max(200).optional(),
  notes: z.string().optional(),
  date: z.string(),
  isCleared: z.boolean().default(false),
});

// INCOME / EXPENSE: single account, category required
export const CreateIncomeExpenseSchema = TransactionBaseSchema.extend({
  type: z.enum(["INCOME", "EXPENSE"]),
  accountId: z.uuid(),
  categoryId: z.uuid(),
  subcategoryId: z.uuid().optional(),
});

// TRANSFER: from/to accounts, no category
export const CreateTransferSchema = TransactionBaseSchema.extend({
  type: z.literal("TRANSFER"),
  fromAccountId: z.uuid(),
  toAccountId: z.uuid(),
}).refine((data) => data.fromAccountId !== data.toAccountId, {
  message: "From and to accounts must be different",
  path: ["toAccountId"],
});

export const CreateTransactionSchema = z.union([
  CreateIncomeExpenseSchema,
  CreateTransferSchema,
]);

export type CreateTransaction = z.infer<typeof CreateTransactionSchema>;
export type CreateIncomeExpense = z.infer<typeof CreateIncomeExpenseSchema>;
export type CreateTransfer = z.infer<typeof CreateTransferSchema>;

// Bulk import — categoryId is optional since CSV imports may lack categories
export const BulkCreateIncomeExpenseSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  accountId: z.uuid(),
  categoryId: z.uuid().optional(),
  amount: z.string(),
  description: z.string().max(200).optional(),
  notes: z.string().optional(),
  date: z.string(),
  isCleared: z.boolean().default(false),
});

export const BulkCreateTransactionsSchema = z.object({
  transactions: z.array(BulkCreateIncomeExpenseSchema).min(1).max(500),
});

export type BulkCreateIncomeExpense = z.infer<
  typeof BulkCreateIncomeExpenseSchema
>;
export type BulkCreateTransactions = z.infer<
  typeof BulkCreateTransactionsSchema
>;

export const BulkImportResultSchema = z.object({
  imported: z.number(),
  failed: z.number(),
  errors: z.array(
    z.object({
      index: z.number(),
      message: z.string(),
    })
  ),
});

export type BulkImportResult = z.infer<typeof BulkImportResultSchema>;

// Update payloads — type cannot be changed
export const UpdateIncomeExpenseSchema = TransactionBaseSchema.partial().extend(
  {
    accountId: z.uuid().optional(),
    categoryId: z.uuid().optional(),
    subcategoryId: z.uuid().nullable().optional(),
  }
);

export const UpdateTransferSchema = TransactionBaseSchema.partial().extend({
  fromAccountId: z.uuid().optional(),
  toAccountId: z.uuid().optional(),
});

export const UpdateTransactionSchema = z.union([
  UpdateIncomeExpenseSchema,
  UpdateTransferSchema,
]);

export type UpdateTransaction = z.infer<typeof UpdateTransactionSchema>;
export type UpdateIncomeExpense = z.infer<typeof UpdateIncomeExpenseSchema>;
export type UpdateTransfer = z.infer<typeof UpdateTransferSchema>;

// ============================================================================
// Query Schemas (API endpoint parameters)
// ============================================================================

export const AccountQuerySchema = z.object({
  group: AccountGroupSchema.optional(),
  isActive: z.boolean().optional(),
  includeInNetWorth: z.boolean().optional(),
  search: z.string().optional(),
});

export type AccountQuery = z.infer<typeof AccountQuerySchema>;

export const CategoryQuerySchema = z.object({
  type: CategoryTypeSchema.optional(),
  isActive: z.boolean().optional(),
  parentId: z.uuid().optional().nullable(),
  search: z.string().optional(),
});

export type CategoryQuery = z.infer<typeof CategoryQuerySchema>;

export const TransactionQuerySchema = z.object({
  accountId: z.uuid().optional(),
  categoryId: z.uuid().optional(),
  type: TransactionTypeSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
  isCleared: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(["date", "amount", "description"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type TransactionQuery = z.input<typeof TransactionQuerySchema>;

// ============================================================================
// API Response Wrapper
// ============================================================================

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z
      .object({
        message: z.string(),
        code: z.string().optional(),
      })
      .optional(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
};
