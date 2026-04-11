import { z } from "zod/v4";

export const WORKSPACE_NAME_PATTERN = /^[A-Za-z0-9]+$/;
export const WORKSPACE_TYPES = ["PERSONAL", "BUSINESS", "SHARED"] as const;
export const DATE_FORMATS = [
  "D MMM, YYYY",
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD",
] as const;
export const WEEK_STARTS = ["SUNDAY", "MONDAY"] as const;
export const SUPPORTED_CURRENCIES = ["CAD", "USD", "EUR", "GBP"] as const;
export const ONBOARDING_ACCOUNT_GROUPS = [
  "chequing",
  "savings",
  "cash",
  "credit_card",
] as const;

export const WorkspaceTypeSchema = z.enum([...WORKSPACE_TYPES]);
export const DateFormatSchema = z.enum(DATE_FORMATS);
export const WeekStartSchema = z.enum(WEEK_STARTS);
export const SupportedCurrencySchema = z.enum(SUPPORTED_CURRENCIES);
export const OnboardingAccountGroupSchema = z.enum(ONBOARDING_ACCOUNT_GROUPS);

export const WorkspaceNameSchema = z
  .string()
  .trim()
  .min(1, "Workspace name is required")
  .max(100, "Workspace name must be 100 characters or fewer")
  .regex(
    WORKSPACE_NAME_PATTERN,
    "Use letters and numbers only, with no spaces or special characters"
  );

export const WorkspaceBasicsSchema = z.object({
  name: WorkspaceNameSchema,
  type: WorkspaceTypeSchema,
});

export const RegionalPreferencesSchema = z.object({
  currency: SupportedCurrencySchema,
  dateFormat: DateFormatSchema,
  weekStart: WeekStartSchema,
  timezone: z.string().min(1, "Timezone is required"),
});

export const FirstAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Account name is required")
    .max(100, "Account name must be 100 characters or fewer"),
  group: OnboardingAccountGroupSchema,
  balance: z
    .string()
    .trim()
    .min(1, "Opening balance is required")
    .regex(/^-?\d+(\.\d{1,2})?$/, "Use a valid amount like 1000 or 1000.00"),
});

export const CheckWorkspaceNameAvailabilityQuerySchema = z.object({
  name: WorkspaceNameSchema,
});

export const CheckWorkspaceNameAvailabilityResultSchema = z.object({
  name: WorkspaceNameSchema,
  available: z.boolean(),
});

export type WorkspaceBasics = z.infer<typeof WorkspaceBasicsSchema>;
export type WorkspaceName = z.infer<typeof WorkspaceNameSchema>;
export type WorkspaceType = z.infer<typeof WorkspaceTypeSchema>;
export type SupportedCurrency = z.infer<typeof SupportedCurrencySchema>;
export type RegionalPreferences = z.infer<typeof RegionalPreferencesSchema>;
export type OnboardingAccountGroup = z.infer<
  typeof OnboardingAccountGroupSchema
>;
export type FirstAccount = z.infer<typeof FirstAccountSchema>;
export type CheckWorkspaceNameAvailabilityQuery = z.infer<
  typeof CheckWorkspaceNameAvailabilityQuerySchema
>;
export type CheckWorkspaceNameAvailabilityResult = z.infer<
  typeof CheckWorkspaceNameAvailabilityResultSchema
>;

export function hasFirstAccountData(account: FirstAccount) {
  return account.name.trim().length > 0 || account.balance.trim().length > 0;
}
