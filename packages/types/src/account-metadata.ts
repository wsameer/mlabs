import { z } from "zod/v4";

// ============================================================================
// Account Metadata Schemas (per account group)
// ============================================================================

// Checking: no type-specific metadata
export const CheckingMetadataSchema = z.object({});

// Savings: no metadata (goals will be a separate feature)
export const SavingsMetadataSchema = z.object({});

// Cash: simple location tracking
export const CashMetadataSchema = z.object({
  location: z.string().max(200).optional(),
});

// Credit Card: no metadata (keeping it minimal, real columns handle the rest)
export const CreditCardMetadataSchema = z.object({});

// Investment: account subtype and contribution tracking
export const InvestmentMetadataSchema = z.object({
  subtype: z
    .enum(["RRSP", "TFSA", "401k", "IRA", "brokerage", "other"])
    .optional(),
  contributionRoom: z.string().optional(),
  contributionYear: z.number().int().min(2000).max(2100).optional(),
});

// Loan: term and payment details
export const LoanMetadataSchema = z.object({
  loanType: z
    .enum(["personal", "auto", "student", "line_of_credit", "other"])
    .optional(),
  termMonths: z.number().int().positive().optional(),
  startDate: z.string().optional(),
  maturityDate: z.string().optional(),
  monthlyPayment: z.string().optional(),
});

// Mortgage: Canadian-style with term vs amortization
export const MortgageMetadataSchema = z.object({
  propertyAccountId: z.uuid().optional(),
  termMonths: z.number().int().positive().optional(),
  amortizationMonths: z.number().int().positive().optional(),
  startDate: z.string().optional(),
  renewalDate: z.string().optional(),
  monthlyPayment: z.string().optional(),
  paymentFrequency: z
    .enum(["monthly", "biweekly", "accelerated_biweekly"])
    .optional(),
});

// Asset: property, vehicle, collectible, etc.
export const AssetMetadataSchema = z.object({
  assetType: z
    .enum(["property", "vehicle", "collectible", "jewelry", "other"])
    .optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.string().optional(),
  location: z.string().max(500).optional(),
  linkedLiabilityId: z.uuid().optional(),
});

// Other: no type-specific metadata
export const OtherMetadataSchema = z.object({});

// ============================================================================
// Metadata schema lookup by account group
// ============================================================================

export const AccountMetadataSchemas = {
  checking: CheckingMetadataSchema,
  savings: SavingsMetadataSchema,
  cash: CashMetadataSchema,
  credit_card: CreditCardMetadataSchema,
  investment: InvestmentMetadataSchema,
  loan: LoanMetadataSchema,
  mortgage: MortgageMetadataSchema,
  asset: AssetMetadataSchema,
  other: OtherMetadataSchema,
} as const;

// ============================================================================
// Type exports
// ============================================================================

export type CheckingMetadata = z.infer<typeof CheckingMetadataSchema>;
export type SavingsMetadata = z.infer<typeof SavingsMetadataSchema>;
export type CashMetadata = z.infer<typeof CashMetadataSchema>;
export type CreditCardMetadata = z.infer<typeof CreditCardMetadataSchema>;
export type InvestmentMetadata = z.infer<typeof InvestmentMetadataSchema>;
export type LoanMetadata = z.infer<typeof LoanMetadataSchema>;
export type MortgageMetadata = z.infer<typeof MortgageMetadataSchema>;
export type AssetMetadata = z.infer<typeof AssetMetadataSchema>;
export type OtherMetadata = z.infer<typeof OtherMetadataSchema>;

export type AccountMetadataMap = {
  checking: CheckingMetadata;
  savings: SavingsMetadata;
  cash: CashMetadata;
  credit_card: CreditCardMetadata;
  investment: InvestmentMetadata;
  loan: LoanMetadata;
  mortgage: MortgageMetadata;
  asset: AssetMetadata;
  other: OtherMetadata;
};

export type AccountGroup = keyof AccountMetadataMap;
export type AccountMetadata = AccountMetadataMap[AccountGroup];
