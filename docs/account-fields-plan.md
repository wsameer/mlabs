# Account Type Fields Plan

## Current State

The `accounts` table currently has a flat schema with fields like `originalAmount`, `interestRate`, `nextPaymentDate`, and `linkedAccountId` that were designed for loans/mortgages but are ignored by other account types. The frontend form (`AccountFormStep.tsx`) collects `name`, `balance`, `type`, and conditionally shows `creditLimit` + `expirationDate` for credit cards -- but **neither field is actually persisted** to the database (the `onSubmit` handler drops them).

## The Core Design Question: Flat Table vs. Metadata Column

There are two approaches:

### Option A: Add columns for every field (wide table)
```
accounts.creditLimit
accounts.expirationDate
accounts.institutionName
accounts.accountNumber
accounts.maturityDate
accounts.brokerageName
accounts.propertyAddress
... (30+ columns, most NULL for any given row)
```

**Pros:** SQL-queryable, type-safe at the DB level, easy indexing
**Cons:** Sparse (most rows have 70%+ NULLs), every new field = migration, schema becomes unwieldy

### Option B: Shared columns + typed JSON metadata (recommended)

Keep universally-shared fields as real columns. Put type-specific fields in a single `metadata` JSON column.

```
accounts.institutionName   -- shared across most types (real column)
accounts.accountNumber     -- shared across most types (real column)
accounts.creditLimit       -- only credit cards need this (real column, since it drives calculations)
accounts.metadata          -- type-specific extras as JSON
```

**Pros:** Fewer migrations, flexible, schema stays clean
**Cons:** JSON not directly queryable in SQLite (but you rarely need to WHERE on metadata fields)

### My Recommendation: Option B with a twist

Use **real columns for anything that drives calculations, filtering, or display logic** (creditLimit, interestRate, originalAmount). Use **metadata JSON for informational/display-only fields** that you never query against (maturity date, property address, brokerage name, etc.).

This gives you the best of both worlds: type safety where it matters, flexibility where it doesn't.

---

## Fields Per Account Type

### Universal Fields (all account types)

These already exist and should stay as real columns:

| Field | Column | Type | Notes |
|---|---|---|---|
| Name | `name` | text | Required |
| Account Group | `group` | enum | Required |
| Opening Balance | `balance` | text (numeric) | Required, default "0" |
| Currency | `currency` | text | 3-char ISO code |
| Color | `color` | text | Hex color for UI |
| Icon | `icon` | text | Emoji or icon ID |
| Active | `isActive` | boolean | Soft delete |
| Include in Net Worth | `includeInNetWorth` | boolean | Controls dashboard totals |
| Sort Order | `sortOrder` | integer | Manual ordering |
| Notes | `notes` | text | Free-form user notes |

**New universal columns to add:**

| Field | Column | Type | Notes |
|---|---|---|---|
| Institution Name | `institutionName` | text, nullable | "TD Bank", "Wealthsimple", etc. Optional, user-entered |
| Account Number | `accountNumber` | text, nullable | Last 4 digits or full number, user's choice. No validation -- it's their data, not ours. Optional. |
| Description | `description` | text, nullable | One-liner like "Joint checking with spouse". Separate from `notes` which is longer-form. |

**Challenging your thought:** You mentioned "name of bank" and "account/credit card number (optional)". I agree these should be universal -- every account type benefits from knowing which institution holds it. But I'd call the column `institutionName` not `bankName` because it applies to brokerages, credit unions, etc. too.

---

### Checking Account

**Purpose:** Day-to-day spending, bill payments, direct deposit.

| Field | Storage | Required | Notes |
|---|---|---|---|
| Name | `name` (column) | Yes | e.g., "TD Chequing" |
| Opening Balance | `balance` (column) | Yes | Current balance |
| Institution Name | `institutionName` (column) | No | e.g., "TD Bank" |
| Account Number | `accountNumber` (column) | No | Last 4 or full |
| Description | `description` (column) | No | Short description |
| Include in Net Worth | `includeInNetWorth` (column) | Yes | Default: true |

**No type-specific fields needed.** Checking accounts are simple -- the universal fields cover everything.

---

### Savings Account

**Purpose:** Earning interest on deposits, emergency funds, goal-based saving.

| Field | Storage | Required | Notes |
|---|---|---|---|
| *(all universal fields)* | columns | | |
| Interest Rate | `interestRate` (column) | No | APY as string, e.g., "4.5" |
| Target Amount | `metadata.targetAmount` | No | Savings goal, e.g., "10000". For "save $10k emergency fund" tracking |
| Target Date | `metadata.targetDate` | No | Goal date, e.g., "2025-12-31" |

**Challenging your thought:** I'm adding `targetAmount` and `targetDate` because savings accounts are frequently goal-oriented. This lets you build a "65% of goal reached" progress bar later. But these are display-only, so they go in metadata.

**Interest Rate stays as a real column** because you'll eventually want to calculate projected interest income.

---

### Cash

**Purpose:** Physical cash, petty cash, envelopes.

| Field | Storage | Required | Notes |
|---|---|---|---|
| *(all universal fields)* | columns | | |
| Location | `metadata.location` | No | "Wallet", "Home safe", "Office drawer" |

**No institution or account number typically applies.** The simplest account type. `institutionName` and `accountNumber` are available but unlikely to be used.

---

### Credit Card

**Purpose:** Revolving credit, rewards tracking, balance management.

| Field | Storage | Required | Notes |
|---|---|---|---|
| *(all universal fields)* | columns | | |
| Credit Limit | `creditLimit` (column) | No | Real column because it drives utilization calculation |
| Interest Rate | `interestRate` (column) | No | APR, not APY. e.g., "19.99" |
| Payment Account | `linkedAccountId` (column) | No | FK to checking/savings account used for payments |
| Statement Day | `metadata.statementDay` | No | Day of month (1-31) when statement closes |
| Due Day | `metadata.dueDay` | No | Day of month (1-31) when payment is due |
| Minimum Payment | `metadata.minimumPayment` | No | e.g., "25" or "10" |
| Rewards Type | `metadata.rewardsType` | No | "cashback", "points", "miles", or null |
| Expiration Date | `metadata.expirationDate` | No | Card expiry, e.g., "2027-03" |

**Challenging your thought:** You mentioned "payment from which bank" -- that's already `linkedAccountId` in the schema, which is a cleaner approach than storing a bank name string. It creates a real relationship between the credit card and the checking account, so later you can auto-suggest transfers.

**Credit Limit as a real column** is important because:
- `creditLimit - abs(balance)` = available credit (calculated field)
- `abs(balance) / creditLimit` = utilization ratio (drives dashboard warnings)
- You may want to query "show me cards over 80% utilization"

**I'd skip storing the full card number.** The `accountNumber` field (last 4 digits) is enough for identification. Storing full card numbers, even optionally, creates a security liability for a self-hosted app where backups might not be encrypted.

---

### Investment

**Purpose:** Brokerage accounts, RRSP, TFSA, 401k, IRA.

| Field | Storage | Required | Notes |
|---|---|---|---|
| *(all universal fields)* | columns | | |
| Account Subtype | `metadata.subtype` | No | "RRSP", "TFSA", "401k", "IRA", "brokerage", "other" |
| Contribution Room | `metadata.contributionRoom` | No | Remaining room for tax-advantaged accounts |
| Contribution Year | `metadata.contributionYear` | No | Year the contribution room applies to |

**Challenging your thought:** I intentionally kept this simple. A personal finance app should track investment **accounts** and their **total balance**, not individual holdings (stocks, ETFs, etc.). That's a portfolio tracker, which is a different product. The balance here represents the total market value of the account, updated manually or via CSV import later.

You could add a `metadata.holdings` array later, but I'd resist the temptation now -- it's a rabbit hole.

---

### Loan

**Purpose:** Personal loans, car loans, student loans, lines of credit.

| Field | Storage | Required | Notes |
|---|---|---|---|
| *(all universal fields)* | columns | | |
| Original Amount | `originalAmount` (column) | No | Principal borrowed |
| Interest Rate | `interestRate` (column) | No | APR, e.g., "5.99" |
| Payment Account | `linkedAccountId` (column) | No | Account used for payments |
| Loan Term Months | `metadata.termMonths` | No | e.g., 60 for 5-year loan |
| Start Date | `metadata.startDate` | No | When the loan began |
| Maturity Date | `metadata.maturityDate` | No | When the loan ends |
| Monthly Payment | `metadata.monthlyPayment` | No | Fixed monthly amount |
| Loan Type | `metadata.loanType` | No | "personal", "auto", "student", "line_of_credit", "other" |

**Balance is negative** for loans (liability). The `includeInNetWorth` flag matters here -- some people exclude student loans from their "financial health" dashboard.

**Original Amount as real column** because `originalAmount - abs(balance)` = amount paid off (drives progress tracking).

---

### Mortgage

**Purpose:** Home loans.

| Field | Storage | Required | Notes |
|---|---|---|---|
| *(all universal fields)* | columns | | |
| Original Amount | `originalAmount` (column) | No | Original mortgage amount |
| Interest Rate | `interestRate` (column) | No | e.g., "3.25" |
| Payment Account | `linkedAccountId` (column) | No | Account used for payments |
| Property Asset | `metadata.propertyAccountId` | No | UUID linking to the corresponding "asset" account for the property |
| Term Months | `metadata.termMonths` | No | e.g., 300 for 25-year |
| Amortization Months | `metadata.amortizationMonths` | No | Canadian mortgages have term != amortization |
| Start Date | `metadata.startDate` | No | Mortgage start |
| Renewal Date | `metadata.renewalDate` | No | When the term renews (Canadian-specific but useful) |
| Monthly Payment | `metadata.monthlyPayment` | No | Fixed payment amount |
| Payment Frequency | `metadata.paymentFrequency` | No | "monthly", "biweekly", "accelerated_biweekly" |

**Challenging your thought:** Canadian mortgages are different from US ones -- they have a term (usually 5 years) within a longer amortization (25 years). The `renewalDate` captures when you need to renegotiate. This is a real-world detail that Canadian users (your target based on CAD default) will appreciate.

**Property linking:** Rather than storing a property address string, link the mortgage to an "asset" account that represents the property. This way:
- Asset value - mortgage balance = home equity (calculated)
- Both show in net worth correctly
- Property details live on the asset account

---

### Asset

**Purpose:** Property, vehicles, collectibles, anything with value but not in a financial institution.

| Field | Storage | Required | Notes |
|---|---|---|---|
| *(all universal fields)* | columns | | |
| Asset Type | `metadata.assetType` | No | "property", "vehicle", "collectible", "jewelry", "other" |
| Purchase Date | `metadata.purchaseDate` | No | When acquired |
| Purchase Price | `metadata.purchasePrice` | No | Original cost |
| Estimated Value | balance (column) | -- | The `balance` field IS the current estimated value |
| Location/Address | `metadata.location` | No | Property address, storage location, etc. |
| Linked Liability | `metadata.linkedLiabilityId` | No | UUID of mortgage/loan against this asset |

**Challenging your thought:** I'd keep `balance` as the current estimated value rather than adding a separate `estimatedValue` field. The user updates it when they get a new appraisal or check market value. This keeps net worth calculations consistent -- `SUM(balance)` across all accounts just works.

---

### Other

**Purpose:** Catch-all for anything that doesn't fit.

| Field | Storage | Required | Notes |
|---|---|---|---|
| *(all universal fields)* | columns | | |

No type-specific fields. The universal fields + `notes` + `description` give enough flexibility.

---

## Database Schema Changes

### New Columns on `accounts` Table

```sql
ALTER TABLE accounts ADD COLUMN institution_name TEXT;
ALTER TABLE accounts ADD COLUMN account_number TEXT;
ALTER TABLE accounts ADD COLUMN description TEXT;
ALTER TABLE accounts ADD COLUMN credit_limit TEXT;      -- numeric as string
ALTER TABLE accounts ADD COLUMN metadata TEXT;           -- JSON string
```

### Updated Drizzle Schema

```typescript
export const accounts = sqliteTable("accounts", {
  // ... existing fields ...

  // New shared fields
  institutionName: text("institution_name"),
  accountNumber: text("account_number"),
  description: text("description"),

  // Credit card specific (real column because it drives calculations)
  creditLimit: text("credit_limit"),  // numeric as string, like balance

  // Type-specific metadata (JSON)
  metadata: text("metadata", { mode: "json" }),

  // ... existing fields continue ...
});
```

### Metadata Type Definitions

```typescript
// packages/types/src/db.ts or a new account-metadata.ts

type CheckingMetadata = Record<string, never>;  // no extras

type SavingsMetadata = {
  targetAmount?: string;
  targetDate?: string;
};

type CashMetadata = {
  location?: string;
};

type CreditCardMetadata = {
  statementDay?: number;
  dueDay?: number;
  minimumPayment?: string;
  rewardsType?: "cashback" | "points" | "miles" | null;
  expirationDate?: string;
};

type InvestmentMetadata = {
  subtype?: "RRSP" | "TFSA" | "401k" | "IRA" | "brokerage" | "other";
  contributionRoom?: string;
  contributionYear?: number;
};

type LoanMetadata = {
  loanType?: "personal" | "auto" | "student" | "line_of_credit" | "other";
  termMonths?: number;
  startDate?: string;
  maturityDate?: string;
  monthlyPayment?: string;
};

type MortgageMetadata = {
  propertyAccountId?: string;
  termMonths?: number;
  amortizationMonths?: number;
  startDate?: string;
  renewalDate?: string;
  monthlyPayment?: string;
  paymentFrequency?: "monthly" | "biweekly" | "accelerated_biweekly";
};

type AssetMetadata = {
  assetType?: "property" | "vehicle" | "collectible" | "jewelry" | "other";
  purchaseDate?: string;
  purchasePrice?: string;
  location?: string;
  linkedLiabilityId?: string;
};

type OtherMetadata = Record<string, never>;

// Discriminated union
type AccountMetadata =
  | { group: "checking" } & CheckingMetadata
  | { group: "savings" } & SavingsMetadata
  | { group: "cash" } & CashMetadata
  | { group: "credit_card" } & CreditCardMetadata
  | { group: "investment" } & InvestmentMetadata
  | { group: "loan" } & LoanMetadata
  | { group: "mortgage" } & MortgageMetadata
  | { group: "asset" } & AssetMetadata
  | { group: "other" } & OtherMetadata;
```

### Zod Validation (for API)

```typescript
const AccountMetadataSchema = z.discriminatedUnion("group", [
  z.object({ group: z.literal("checking") }),
  z.object({
    group: z.literal("savings"),
    targetAmount: z.string().optional(),
    targetDate: z.string().optional(),
  }),
  z.object({
    group: z.literal("cash"),
    location: z.string().max(200).optional(),
  }),
  z.object({
    group: z.literal("credit_card"),
    statementDay: z.number().int().min(1).max(31).optional(),
    dueDay: z.number().int().min(1).max(31).optional(),
    minimumPayment: z.string().optional(),
    rewardsType: z.enum(["cashback", "points", "miles"]).nullable().optional(),
    expirationDate: z.string().optional(),
  }),
  // ... etc
]);
```

---

## API Changes

### Create Account (POST /api/accounts)

Add new fields to `CreateAccountSchema`:

```typescript
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
  // New
  institutionName: z.string().max(100).optional(),
  accountNumber: z.string().max(50).optional(),
  description: z.string().max(200).optional(),
  creditLimit: z.string().optional(),
  metadata: AccountMetadataSchema.optional(),
});
```

### Update Account (PATCH /api/accounts/:id)

Same fields, all optional (already handled by `.partial()`).

### Service Changes

`accounts.service.ts` needs to:
1. Accept and persist new fields in `createAccount` and `updateAccount`
2. Validate metadata matches the account group (can't have mortgage metadata on a checking account)
3. Serialize metadata in the response

### Serializer Changes

`account-serializer.ts` needs to handle the new fields and parse the JSON metadata.

---

## Frontend Impact

### Account Creation Flow

The current `AccountFormStep.tsx` needs to become group-aware:

1. **Universal section** (always shown): Name, Opening Balance, Institution, Account Number, Description
2. **Type-specific section** (conditional): Rendered based on `group` value
3. **Settings section** (always shown): Include in Net Worth, Color, Icon

### Suggested Component Structure

```
CreateAccountDialog
├── AccountTypeStep          (existing - pick account type)
├── AccountFormStep          (refactor - universal fields + dynamic type fields)
│   ├── UniversalFields      (name, balance, institution, account number)
│   ├── CreditCardFields     (credit limit, statement day, due day, etc.)
│   ├── SavingsFields        (interest rate, savings goal)
│   ├── LoanFields           (original amount, interest rate, term, etc.)
│   ├── MortgageFields       (original amount, term, renewal, etc.)
│   ├── InvestmentFields     (subtype, contribution room)
│   ├── AssetFields          (asset type, purchase info)
│   └── SettingsFields       (include in net worth, color, icon)
└── Success state
```

---

## What I'd Push Back On

1. **Don't collect expiration date for credit cards as a prominent field.** It's marginally useful and creates anxiety ("is my card expiring?"). Put it in metadata, not the main form. Users who care can add it.

2. **Don't store interest rate as a percentage string.** Consider storing it as a decimal (e.g., "0.0599" for 5.99%) to avoid display vs. calculation ambiguity. The frontend formats it as "5.99%" but calculations use the raw value. *However*, since you're already storing amounts as strings, keeping "5.99" and dividing by 100 in calculations is also fine -- just be consistent.

3. **Account number security.** Even though you said "optional" and "no PII", a full credit card number IS PII under PIPEDA (you're in Canada based on CAD/Toronto defaults). I'd limit the field to a freeform text with a hint like "Last 4 digits or nickname" rather than calling it "account number" which implies the full thing.

4. **Don't add a `bankName` AND `institutionName`.** One field covers banks, credit unions, brokerages, and crypto exchanges. Call it `institutionName`.

5. **Skip `nextPaymentDate` as a column.** It exists in your current schema but it's a moving target -- it changes every month. Either derive it from `metadata.dueDay` + current month, or let users track payments as transactions. A static date that goes stale is worse than no date.

---

## Migration Strategy

### Phase 1: Schema + API (this PR)
1. Add new columns to Drizzle schema
2. Generate and run migration
3. Update Zod types in `packages/types`
4. Update service + serializer
5. Seed data with sample metadata

### Phase 2: Frontend Forms (next PR)
1. Refactor `AccountFormStep` with group-specific sections
2. Add metadata fields to create/edit forms
3. Update account detail/list views to show relevant metadata

### Phase 3: Calculations + Display (future)
1. Credit utilization warnings
2. Loan payoff progress bars
3. Savings goal tracking
4. Net worth breakdown by asset/liability type

---

## Summary Table

| Account Type | Real Columns (new) | Metadata Fields | Existing Columns Used |
|---|---|---|---|
| Checking | institutionName, accountNumber, description | *(none)* | name, balance, currency |
| Savings | institutionName, accountNumber, description | targetAmount, targetDate | name, balance, interestRate |
| Cash | description | location | name, balance |
| Credit Card | institutionName, accountNumber, description, creditLimit | statementDay, dueDay, minimumPayment, rewardsType, expirationDate | name, balance, interestRate, linkedAccountId |
| Investment | institutionName, accountNumber, description | subtype, contributionRoom, contributionYear | name, balance |
| Loan | institutionName, accountNumber, description | loanType, termMonths, startDate, maturityDate, monthlyPayment | name, balance, originalAmount, interestRate, linkedAccountId |
| Mortgage | institutionName, accountNumber, description | propertyAccountId, termMonths, amortizationMonths, startDate, renewalDate, monthlyPayment, paymentFrequency | name, balance, originalAmount, interestRate, linkedAccountId |
| Asset | description | assetType, purchaseDate, purchasePrice, location, linkedLiabilityId | name, balance |
| Other | institutionName, accountNumber, description | *(none)* | name, balance |
