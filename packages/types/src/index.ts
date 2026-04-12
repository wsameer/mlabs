// =============================================================================
// Schema — entities, enums, API payloads, query schemas
// =============================================================================

export {
  // Health
  HealthCheckSchema,
  // Enum schemas
  ProfileTypeSchema,
  AccountGroupSchema,
  CategoryTypeSchema,
  TransactionTypeSchema,
  TransactionDirectionSchema,
  // Entity schemas
  ProfileSchema,
  AccountSchema,
  CategorySchema,
  CategoryWithSubcategoriesSchema,
  TransactionSchema,
  TransactionSummarySchema,
  // API payloads (profileId injected by middleware)
  CreateAccountSchema,
  UpdateAccountSchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  CreateTransactionSchema,
  CreateIncomeExpenseSchema,
  CreateTransferSchema,
  UpdateTransactionSchema,
  UpdateIncomeExpenseSchema,
  UpdateTransferSchema,
  UpdateProfileSchema,
  CreateOnboardingProfileSchema,
  // Bulk import
  BulkCreateIncomeExpenseSchema,
  BulkCreateTransactionsSchema,
  BulkImportResultSchema,
  // Query schemas
  AccountQuerySchema,
  CategoryQuerySchema,
  TransactionQuerySchema,
  // Bootstrap / onboarding
  BootstrapStatusSchema,
  BootstrapSchema,
  OnboardingAccountSchema,
  ProfileParamsSchema,
  // API response
  ApiResponseSchema,
  // Validation
  validateAccountMetadata,
} from "./schema.js";

export type {
  // Health
  HealthCheck,
  // Enum types
  ProfileType,
  AccountGroup,
  CategoryType,
  TransactionType,
  TransactionDirection,
  DateFormat,
  WeekStart,
  // Entity types
  Profile,
  Account,
  Category,
  CategoryWithSubcategories,
  Transaction,
  TransactionSummary,
  // API payload types
  CreateAccount,
  UpdateAccount,
  CreateCategory,
  UpdateCategory,
  CreateTransaction,
  CreateIncomeExpense,
  CreateTransfer,
  UpdateTransaction,
  UpdateIncomeExpense,
  UpdateTransfer,
  UpdateProfile,
  CreateOnboardingProfile,
  OnboardingAccount,
  // Bulk import types
  BulkCreateIncomeExpense,
  BulkCreateTransactions,
  BulkImportResult,
  // Query types
  AccountQuery,
  CategoryQuery,
  TransactionQuery,
  // Bootstrap
  Bootstrap,
  BootstrapStatus,
  ProfileParams,
  // API response
  ApiResponse,
} from "./schema.js";

// =============================================================================
// Environment
// =============================================================================

export { BaseEnvSchema, ApiEnvSchema, WebEnvSchema } from "./env.js";
export type { ApiEnv, WebEnv } from "./env.js";

// =============================================================================
// App-level types (non-database)
// =============================================================================

export { ACCOUNT_GROUPS } from "./app.js";
export type {
  TimeGrain,
  BackendStatus,
  DateRange,
  DateNavDirections,
} from "./app.js";

// =============================================================================
// Onboarding
// =============================================================================

export {
  WORKSPACE_TYPES,
  DATE_FORMATS,
  WEEK_STARTS,
  SUPPORTED_CURRENCIES,
  ONBOARDING_ACCOUNT_GROUPS,
  WorkspaceTypeSchema,
  DateFormatSchema,
  WeekStartSchema,
  SupportedCurrencySchema,
  OnboardingAccountGroupSchema,
  WorkspaceNameSchema,
  WorkspaceBasicsSchema,
  RegionalPreferencesSchema,
  FirstAccountSchema,
  CheckWorkspaceNameAvailabilityQuerySchema,
  CheckWorkspaceNameAvailabilityResultSchema,
  hasFirstAccountData,
} from "./onboarding.js";

export type {
  WorkspaceBasics,
  WorkspaceName,
  WorkspaceType,
  SupportedCurrency,
  RegionalPreferences,
  OnboardingAccountGroup,
  FirstAccount,
  CheckWorkspaceNameAvailabilityQuery,
  CheckWorkspaceNameAvailabilityResult,
} from "./onboarding.js";

// =============================================================================
// Account Metadata
// =============================================================================

export {
  AccountMetadataSchemas,
  ChequingMetadataSchema,
  SavingsMetadataSchema,
  CashMetadataSchema,
  CreditCardMetadataSchema,
  InvestmentMetadataSchema,
  LoanMetadataSchema,
  MortgageMetadataSchema,
  AssetMetadataSchema,
  OtherMetadataSchema,
} from "./account-metadata.js";

export type {
  ChequingMetadata,
  SavingsMetadata,
  CashMetadata,
  CreditCardMetadata,
  InvestmentMetadata,
  LoanMetadata,
  MortgageMetadata,
  AssetMetadata,
  OtherMetadata,
  AccountMetadataMap,
  AccountMetadata,
} from "./account-metadata.js";
