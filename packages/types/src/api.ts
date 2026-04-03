import z from "zod";

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

export const DateFormatSchema = z.enum([
  "D MMM, YYYY", // 12 Aug, 2025
  "DD/MM/YYYY", // 12/08/2025
  "MM/DD/YYYY", // 08/12/2025
  "YYYY-MM-DD", // 2025-08-12
]);

export const WeekStartSchema = z.enum(["SUNDAY", "MONDAY"]);

export const ProfileTypeSchema = z.enum(["PERSONAL", "BUSINESS", "SHARED"]);

export const AccountGroupSchema = z.enum([
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

export const CategoryTypeSchema = z.enum(["INCOME", "EXPENSE"]);

export const TransactionTypeSchema = z.enum(["INCOME", "EXPENSE", "TRANSFER"]);

// ============================================================================
// Profile / Workspace
// ============================================================================

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  icon: z.string().max(10).optional(),
  type: ProfileTypeSchema.default("PERSONAL"),
  // Regional preferences
  currency: z.string().length(3).default("CAD"),
  dateFormat: DateFormatSchema.default("D MMM, YYYY"),
  weekStart: WeekStartSchema.default("MONDAY"),
  timezone: z.string().default("America/Toronto"),
  // State
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isSetupComplete: z.boolean().default(false),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileType = z.infer<typeof ProfileTypeSchema>;
export type DateFormat = z.infer<typeof DateFormatSchema>;
export type WeekStart = z.infer<typeof WeekStartSchema>;

export const InsertProfileSchema = ProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.string().uuid().optional(),
});

export type InsertProfile = z.infer<typeof InsertProfileSchema>;

// ============================================================================
// Account
// ============================================================================

export const AccountSchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  name: z.string().min(1).max(100),
  group: AccountGroupSchema,
  // Negative for liabilities (loans, mortgages, credit cards)
  balance: z.string(), // numeric as string
  currency: z.string().length(3).default("CAD"),
  // Loan / mortgage extras
  originalAmount: z.string().optional(),
  interestRate: z.string().optional(),
  nextPaymentDate: z.string().optional(),
  // Generic linking: credit card → payment account, mortgage → property
  linkedAccountId: z.string().uuid().nullable().optional(),
  // Display
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/)
    .optional(),
  icon: z.string().max(50).optional(),
  // Behaviour
  isActive: z.boolean().default(true),
  includeInNetWorth: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Account = z.infer<typeof AccountSchema>;
export type AccountGroup = z.infer<typeof AccountGroupSchema>;

export const InsertAccountSchema = AccountSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.string().uuid().optional(),
  balance: z.string().optional(),
  originalAmount: z.string().optional(),
  interestRate: z.string().optional(),
});

export type InsertAccount = z.infer<typeof InsertAccountSchema>;

// ============================================================================
// Category
// ============================================================================

export const CategorySchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: CategoryTypeSchema,
  icon: z.string().max(50).optional(),
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/)
    .optional(),
  parentId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Category = z.infer<typeof CategorySchema>;
export type CategoryType = z.infer<typeof CategoryTypeSchema>;

export const InsertCategorySchema = CategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.string().uuid().optional(),
});

export type InsertCategory = z.infer<typeof InsertCategorySchema>;

// ============================================================================
// Transaction
// ============================================================================

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  accountId: z.string().uuid(),
  // null for TRANSFER transactions
  categoryId: z.string().uuid().nullable().optional(),
  type: TransactionTypeSchema,
  // Always positive — type + account side determines direction
  amount: z.string(), // numeric
  // Short memo shown in transaction list
  description: z.string().max(200).optional(),
  // Long-form optional detail
  notes: z.string().optional(),
  date: z.string(), // date type
  // Double-entry transfers: both records share this UUID
  // null for INCOME / EXPENSE
  transferId: z.string().uuid().nullable().optional(),
  isCleared: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const InsertTransactionSchema = TransactionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.string().uuid().optional(),
  amount: z.string(),
});

export type InsertTransaction = z.infer<typeof InsertTransactionSchema>;

// ============================================================================
// API Response wrapper
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
