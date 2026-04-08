import { z } from "zod/v4";
import { AccountMetadataSchemas } from "./account-metadata.js";

// ============================================================================
// Enums - Must match packages/db/src/schema.ts
// ============================================================================

export const DateFormatEnum = z.enum([
  "D MMM, YYYY",
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD",
]);

export const WeekStartEnum = z.enum(["SUNDAY", "MONDAY"]);

export const ProfileTypeEnum = z.enum(["PERSONAL", "BUSINESS", "SHARED"]);

export const AccountGroupEnum = z.enum([
  "checking",
  "savings",
  "cash",
  "credit_card",
  "investment",
  "loan",
  "mortgage",
  "asset",
  "other",
]);

export const CategoryTypeEnum = z.enum(["INCOME", "EXPENSE"]);

export const TransactionTypeEnum = z.enum(["INCOME", "EXPENSE", "TRANSFER"]);

export type DateFormat = z.infer<typeof DateFormatEnum>;
export type WeekStart = z.infer<typeof WeekStartEnum>;
export type ProfileType = z.infer<typeof ProfileTypeEnum>;
export type AccountGroup = z.infer<typeof AccountGroupEnum>;
export type CategoryType = z.infer<typeof CategoryTypeEnum>;
export type TransactionType = z.infer<typeof TransactionTypeEnum>;

// ============================================================================
// Profile Schemas
// ============================================================================

export const ProfileSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(100),
  icon: z.string().max(10).optional(),
  type: ProfileTypeEnum.default("PERSONAL"),
  // Regional preferences
  currency: z.string().length(3).default("CAD"),
  dateFormat: DateFormatEnum.default("D MMM, YYYY"),
  weekStart: WeekStartEnum.default("MONDAY"),
  timezone: z.string().default("America/Toronto"),
  // State
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isSetupComplete: z.boolean().default(false),
  notes: z.string().max(160).optional(),
  createdAt: z.iso.date(),
  updatedAt: z.iso.date(),
});

export type Profile = z.infer<typeof ProfileSchema>;

// profileId injected by middleware from X-Profile-Id header
export const CreateProfileSchema = ProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isDefault: true,
  isActive: true,
  isSetupComplete: true,
}).extend({
  id: z.uuid().optional(),
});

export type CreateProfile = z.infer<typeof CreateProfileSchema>;

export const UpdateProfileSchema = CreateProfileSchema.partial();
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;

// ============================================================================
// Account Schemas
// ============================================================================

export const AccountSchema = z.object({
  id: z.uuid(),
  profileId: z.uuid(),
  name: z.string().min(1).max(100),
  group: AccountGroupEnum,
  // Negative for liabilities (credit_card, loan, mortgage)
  balance: z.string(), // numeric as string
  currency: z.string().length(3).default("CAD"),
  // Shared optional fields
  institutionName: z.string().max(100).nullable().optional(),
  accountNumber: z.string().max(50).nullable().optional(),
  description: z.string().max(200).nullable().optional(),
  // Loan/Mortgage fields
  originalAmount: z.string().nullable().optional(),
  interestRate: z.string().nullable().optional(),
  // Credit card (drives utilization calculations)
  creditLimit: z.string().nullable().optional(),
  // Generic linking: credit_card → payment account, mortgage → property
  linkedAccountId: z.uuid().nullable().optional(),
  // Type-specific extras as JSON
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  // Display
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/)
    .nullable()
    .optional(),
  icon: z.string().max(50).nullable().optional(),
  // Behaviour
  isActive: z.boolean().default(true),
  includeInNetWorth: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  notes: z.string().nullable().optional(),
  createdAt: z.iso.date(),
  updatedAt: z.iso.date(),
});

export type Account = z.infer<typeof AccountSchema>;

// profileId injected by middleware
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

// Helper to validate metadata against the account group
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
// Category Schemas
// ============================================================================

export const CategorySchema = z.object({
  id: z.uuid(),
  profileId: z.uuid(),
  name: z.string().min(1).max(100),
  type: CategoryTypeEnum,
  // UI customization
  icon: z.string().max(50).optional(),
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/)
    .optional(),
  // Single level of nesting
  parentId: z.uuid().nullable().optional(),
  // State
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  createdAt: z.iso.date(),
  updatedAt: z.iso.date(),
});

export type Category = z.infer<typeof CategorySchema>;

// Category with nested subcategories
export const CategoryWithSubcategoriesSchema = CategorySchema.extend({
  subcategories: z.array(CategorySchema).optional(),
});

export type CategoryWithSubcategories = z.infer<
  typeof CategoryWithSubcategoriesSchema
>;

// profileId injected by middleware
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
// Transaction Schemas
// ============================================================================

export const TransactionSchema = z.object({
  id: z.uuid(),
  profileId: z.uuid(),
  accountId: z.uuid(),
  // null for TRANSFER transactions
  categoryId: z.uuid().nullable().optional(),
  type: TransactionTypeEnum,
  // Always positive - type determines direction
  amount: z.string(), // numeric as string
  // Short memo
  description: z.string().max(200).optional(),
  // Long-form details
  notes: z.string().optional(),
  // Transaction date
  date: z.string(), // YYYY-MM-DD
  // Double-entry transfers: both records share this UUID
  transferId: z.uuid().optional(),
  // Reconciliation
  isCleared: z.boolean().default(false),
  createdAt: z.iso.date(),
  updatedAt: z.iso.date(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

// Lightweight transaction for lists
export const TransactionSummarySchema = TransactionSchema.pick({
  id: true,
  date: true,
  type: true,
  amount: true,
  description: true,
  isCleared: true,
}).extend({
  accountName: z.string(),
  categoryName: z.string().nullable(),
  categoryIcon: z.string().nullable(),
  categoryColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/)
    .optional(),
});

export type TransactionSummary = z.infer<typeof TransactionSummarySchema>;

// profileId injected by middleware
export const CreateTransactionSchema = TransactionSchema.omit({
  id: true,
  profileId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.uuid().optional(),
  amount: z.string(),
  transferId: z.uuid().optional(),
});

export type CreateTransaction = z.infer<typeof CreateTransactionSchema>;

export const UpdateTransactionSchema = CreateTransactionSchema.partial();
export type UpdateTransaction = z.infer<typeof UpdateTransactionSchema>;

// ============================================================================
// Query Schemas (for API endpoints)
// ============================================================================

export const AccountQuerySchema = z.object({
  group: AccountGroupEnum.optional(),
  isActive: z.boolean().optional(),
  includeInNetWorth: z.boolean().optional(),
  search: z.string().optional(),
});

export type AccountQuery = z.infer<typeof AccountQuerySchema>;

export const CategoryQuerySchema = z.object({
  type: CategoryTypeEnum.optional(),
  isActive: z.boolean().optional(),
  parentId: z.uuid().optional().nullable(),
  search: z.string().optional(),
});

export type CategoryQuery = z.infer<typeof CategoryQuerySchema>;

export const TransactionQuerySchema = z.object({
  accountId: z.uuid().optional(),
  categoryId: z.uuid().optional(),
  type: TransactionTypeEnum.optional(),
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

export type TransactionQuery = z.infer<typeof TransactionQuerySchema>;

export const ProfileQuerySchema = z.object({
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  search: z.string().optional(),
});

export type ProfileQuery = z.infer<typeof ProfileQuerySchema>;

// ============================================================================
// Pagination
// ============================================================================

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export const PaginatedResponseSchema = <T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
) => ({
  items,
  total,
  page,
  pageSize,
  hasMore: page * pageSize < total,
});

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};
