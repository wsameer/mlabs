import { useState } from "react";
import { toast } from "sonner";

import { Controller, useForm } from "react-hook-form";
import { useCreateAccount } from "../accounts/api/use-accounts.js";
import { ChevronDownIcon, DollarSignIcon, PercentIcon } from "lucide-react";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@workspace/ui/components/field";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";
import { ACCOUNT_GROUPS, type AccountGroupType } from "@workspace/types";

// Which account groups are held at a financial institution
const BANK_HELD_GROUPS: AccountGroupType[] = [
  "chequing",
  "savings",
  "credit_card",
  "investment",
  "loan",
  "mortgage",
];

const PLACEHOLDER_NAMES: Record<AccountGroupType, string> = {
  chequing: "TD Chequing",
  savings: "High Interest Savings",
  cash: "Wallet",
  credit_card: "Visa Infinite",
  investment: "TFSA — Wealthsimple",
  loan: "Car Loan",
  mortgage: "Home Mortgage",
  asset: "2020 Honda Civic",
  other: "Other Account",
};

const accountFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  balance: z.string().min(1, "Balance is required"),
  type: z.enum([...ACCOUNT_GROUPS], {
    message: "Please select an account type",
  }),

  // Bank-held: institution & last 4 digits
  institutionName: z.string().max(100).optional(),
  accountNumber: z
    .string()
    .max(4)
    .regex(/^\d{0,4}$/, "Must be up to 4 digits")
    .optional(),

  // Credit card
  creditLimit: z.string().optional(),

  // Loan / Mortgage shared
  originalAmount: z.string().optional(),
  interestRate: z.string().optional(),

  // Investment metadata
  investmentSubtype: z
    .enum(["RRSP", "TFSA", "401k", "IRA", "brokerage", "other"])
    .optional(),
  contributionRoom: z.string().optional(),
  contributionYear: z.string().optional(),

  // Loan metadata
  loanType: z
    .enum(["personal", "auto", "student", "line_of_credit", "other"])
    .optional(),
  termMonths: z.string().optional(),
  startDate: z.string().optional(),
  maturityDate: z.string().optional(),
  monthlyPayment: z.string().optional(),

  // Mortgage metadata
  amortizationMonths: z.string().optional(),
  renewalDate: z.string().optional(),
  paymentFrequency: z
    .enum(["monthly", "biweekly", "accelerated_biweekly"])
    .optional(),

  // Asset metadata
  assetType: z
    .enum(["property", "vehicle", "collectible", "jewelry", "other"])
    .optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.string().optional(),

  // Cash / Asset
  location: z.string().max(200).optional(),

  // Shared optional
  currency: z.string().length(3).default("CAD"),
  description: z.string().max(200).optional(),
  notes: z.string().optional(),
  includeInNetWorth: z.boolean().default(true),
});

type AccountFormValues = z.output<typeof accountFormSchema>;

interface Props {
  type: AccountGroupType;
  onSuccess: (data: AccountFormValues) => void;
  onBack: () => void;
}

function buildMetadata(
  data: AccountFormValues
): Record<string, unknown> | undefined {
  const type = data.type;
  const meta: Record<string, unknown> = {};

  if (type === "cash") {
    if (data.location) meta.location = data.location;
  }

  if (type === "investment") {
    if (data.investmentSubtype) meta.subtype = data.investmentSubtype;
    if (data.contributionRoom) meta.contributionRoom = data.contributionRoom;
    if (data.contributionYear)
      meta.contributionYear = Number(data.contributionYear);
  }

  if (type === "loan") {
    if (data.loanType) meta.loanType = data.loanType;
    if (data.termMonths) meta.termMonths = Number(data.termMonths);
    if (data.startDate) meta.startDate = data.startDate;
    if (data.maturityDate) meta.maturityDate = data.maturityDate;
    if (data.monthlyPayment) meta.monthlyPayment = data.monthlyPayment;
  }

  if (type === "mortgage") {
    if (data.termMonths) meta.termMonths = Number(data.termMonths);
    if (data.amortizationMonths)
      meta.amortizationMonths = Number(data.amortizationMonths);
    if (data.startDate) meta.startDate = data.startDate;
    if (data.renewalDate) meta.renewalDate = data.renewalDate;
    if (data.monthlyPayment) meta.monthlyPayment = data.monthlyPayment;
    if (data.paymentFrequency) meta.paymentFrequency = data.paymentFrequency;
  }

  if (type === "asset") {
    if (data.assetType) meta.assetType = data.assetType;
    if (data.purchaseDate) meta.purchaseDate = data.purchaseDate;
    if (data.purchasePrice) meta.purchasePrice = data.purchasePrice;
    if (data.location) meta.location = data.location;
  }

  return Object.keys(meta).length > 0 ? meta : undefined;
}

export function AccountFormStep({ type, onSuccess, onBack }: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const createAccount = useCreateAccount();
  const isBankHeld = BANK_HELD_GROUPS.includes(type);

  const form = useForm<AccountFormValues>({
    // eslint-disable-next-line
    resolver: zodResolver(accountFormSchema) as any,
    mode: "onChange",
    defaultValues: {
      name: "",
      balance: "0",
      type,
      currency: "CAD",
      description: "",
      notes: "",
      includeInNetWorth: true,
    },
  });

  function onSubmit(data: AccountFormValues) {
    const metadata = buildMetadata(data);

    createAccount.mutate(
      {
        name: data.name,
        group: data.type,
        balance: data.balance,
        currency: data.currency || "CAD",
        isActive: true,
        includeInNetWorth: data.includeInNetWorth,
        sortOrder: 0,
        ...(data.institutionName && { institutionName: data.institutionName }),
        ...(data.accountNumber && { accountNumber: data.accountNumber }),
        ...(data.description?.trim() && {
          description: data.description.trim(),
        }),
        ...(data.notes?.trim() && { notes: data.notes.trim() }),
        ...(data.creditLimit && { creditLimit: data.creditLimit }),
        ...(data.originalAmount && { originalAmount: data.originalAmount }),
        ...(data.interestRate && { interestRate: data.interestRate }),
        ...(metadata && { metadata }),
      },
      {
        onSuccess: () => {
          toast.success("Account created successfully");
          onSuccess(data);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create account");
        },
      }
    );
  }

  // All types have at least currency/description/notes/includeInNetWorth
  const hasAdvancedFields = true;

  return (
    <form
      id="account-creation-form"
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4 px-4 pb-4"
    >
      <FieldGroup>
        {/* ── Universal: Name ── */}
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="account-creation-form-name">
                Account name
              </FieldLabel>
              <Input
                {...field}
                id="account-creation-form-name"
                className="text-xs"
                placeholder={PLACEHOLDER_NAMES[type]}
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* ── Universal: Balance ── */}
        <Controller
          name="balance"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="account-creation-form-balance">
                {type === "loan" || type === "mortgage"
                  ? "Current balance owing"
                  : "Current balance"}
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  {...field}
                  id="account-creation-form-balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="text-xs"
                />
                <InputGroupAddon>
                  <DollarSignIcon />
                </InputGroupAddon>
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* ── Credit Card: Credit Limit ── */}
        {type === "credit_card" && (
          <Controller
            name="creditLimit"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="account-creation-form-credit-limit">
                  Credit limit
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="account-creation-form-credit-limit"
                    type="number"
                    step="0.01"
                    placeholder="5000.00"
                    className="text-xs"
                  />
                  <InputGroupAddon>
                    <DollarSignIcon />
                  </InputGroupAddon>
                </InputGroup>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        )}

        {/* ── Investment: Subtype ── */}
        {type === "investment" && (
          <Controller
            name="investmentSubtype"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="account-creation-form-investment-subtype">
                  Account subtype
                </FieldLabel>
                <NativeSelect
                  id="account-creation-form-investment-subtype"
                  className="w-full"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || undefined)}
                >
                  <NativeSelectOption value="">Select type…</NativeSelectOption>
                  <NativeSelectOption value="TFSA">TFSA</NativeSelectOption>
                  <NativeSelectOption value="RRSP">RRSP</NativeSelectOption>
                  <NativeSelectOption value="401k">401(k)</NativeSelectOption>
                  <NativeSelectOption value="IRA">IRA</NativeSelectOption>
                  <NativeSelectOption value="brokerage">
                    Brokerage
                  </NativeSelectOption>
                  <NativeSelectOption value="other">Other</NativeSelectOption>
                </NativeSelect>
              </Field>
            )}
          />
        )}

        {/* ── Loan: Type ── */}
        {type === "loan" && (
          <Controller
            name="loanType"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="account-creation-form-loan-type">
                  Loan type
                </FieldLabel>
                <NativeSelect
                  id="account-creation-form-loan-type"
                  className="w-full"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || undefined)}
                >
                  <NativeSelectOption value="">Select type…</NativeSelectOption>
                  <NativeSelectOption value="personal">
                    Personal
                  </NativeSelectOption>
                  <NativeSelectOption value="auto">Auto</NativeSelectOption>
                  <NativeSelectOption value="student">
                    Student
                  </NativeSelectOption>
                  <NativeSelectOption value="line_of_credit">
                    Line of Credit
                  </NativeSelectOption>
                  <NativeSelectOption value="other">Other</NativeSelectOption>
                </NativeSelect>
              </Field>
            )}
          />
        )}

        {/* ── Loan / Mortgage: Original Amount + Interest Rate ── */}
        {(type === "loan" || type === "mortgage") && (
          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="originalAmount"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="account-creation-form-original-amount">
                    Original amount
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id="account-creation-form-original-amount"
                      type="number"
                      step="0.01"
                      placeholder="250000.00"
                      className="text-xs"
                    />
                    <InputGroupAddon>
                      <DollarSignIcon />
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="interestRate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="account-creation-form-interest-rate">
                    Interest rate
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id="account-creation-form-interest-rate"
                      type="number"
                      step="0.01"
                      placeholder="5.25"
                      className="text-xs"
                    />
                    <InputGroupAddon>
                      <PercentIcon />
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
        )}

        {/* ── Asset: Type ── */}
        {type === "asset" && (
          <Controller
            name="assetType"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="account-creation-form-asset-type">
                  Asset type
                </FieldLabel>
                <NativeSelect
                  id="account-creation-form-asset-type"
                  className="w-full"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || undefined)}
                >
                  <NativeSelectOption value="">Select type…</NativeSelectOption>
                  <NativeSelectOption value="property">
                    Property
                  </NativeSelectOption>
                  <NativeSelectOption value="vehicle">
                    Vehicle
                  </NativeSelectOption>
                  <NativeSelectOption value="collectible">
                    Collectible
                  </NativeSelectOption>
                  <NativeSelectOption value="jewelry">
                    Jewelry
                  </NativeSelectOption>
                  <NativeSelectOption value="other">Other</NativeSelectOption>
                </NativeSelect>
              </Field>
            )}
          />
        )}
      </FieldGroup>

      {/* ── Advanced (optional) fields ── */}
      {hasAdvancedFields && (
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger className="flex w-full items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ChevronDownIcon
              className={`size-3.5 transition-transform ${advancedOpen ? "rotate-0" : "-rotate-90"}`}
            />
            Additional details
          </CollapsibleTrigger>
          <CollapsibleContent>
            <FieldGroup className="pt-3">
              {/* Bank-held: Institution Name */}
              {isBankHeld && (
                <Controller
                  name="institutionName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="account-creation-form-institution">
                        Institution name
                      </FieldLabel>
                      <Input
                        {...field}
                        id="account-creation-form-institution"
                        className="text-xs"
                        placeholder="TD Bank"
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}

              {/* Bank-held: Account Number (last 4) */}
              {isBankHeld && (
                <Controller
                  name="accountNumber"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="account-creation-form-account-number">
                        Last 4 digits
                      </FieldLabel>
                      <Input
                        {...field}
                        id="account-creation-form-account-number"
                        className="text-xs"
                        placeholder="1234"
                        maxLength={4}
                        inputMode="numeric"
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}

              {/* Currency */}
              <Controller
                name="currency"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="account-creation-form-currency">
                      Currency
                    </FieldLabel>
                    <Input
                      {...field}
                      id="account-creation-form-currency"
                      className="text-xs"
                      placeholder="CAD"
                      maxLength={3}
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Description */}
              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="account-creation-form-description">
                      Description
                    </FieldLabel>
                    <Input
                      {...field}
                      id="account-creation-form-description"
                      className="text-xs"
                      placeholder="Short description"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Notes */}
              <Controller
                name="notes"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="account-creation-form-notes">
                      Notes
                    </FieldLabel>
                    <Input
                      {...field}
                      id="account-creation-form-notes"
                      className="text-xs"
                      placeholder="Any additional notes"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Include in net worth */}
              <Controller
                name="includeInNetWorth"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked as boolean)
                      }
                    />
                    <FieldContent>
                      <FieldTitle>Include in net worth</FieldTitle>
                      <FieldDescription>
                        Count this account in net worth calculations
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                )}
              />

              {/* Cash: Location */}
              {type === "cash" && (
                <Controller
                  name="location"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="account-creation-form-location">
                        Location
                      </FieldLabel>
                      <Input
                        {...field}
                        id="account-creation-form-location"
                        className="text-xs"
                        placeholder="Wallet, safe, envelope…"
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}

              {/* Investment: Contribution Room + Year */}
              {type === "investment" && (
                <div className="grid grid-cols-2 gap-3">
                  <Controller
                    name="contributionRoom"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="account-creation-form-contribution-room">
                          Contribution room
                        </FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            id="account-creation-form-contribution-room"
                            type="number"
                            step="0.01"
                            placeholder="7000.00"
                            className="text-xs"
                          />
                          <InputGroupAddon>
                            <DollarSignIcon />
                          </InputGroupAddon>
                        </InputGroup>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="contributionYear"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="account-creation-form-contribution-year">
                          Contribution year
                        </FieldLabel>
                        <Input
                          {...field}
                          id="account-creation-form-contribution-year"
                          type="number"
                          className="text-xs"
                          placeholder="2026"
                          min={2000}
                          max={2100}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
              )}

              {/* Loan: Term, Start, Maturity, Monthly Payment */}
              {type === "loan" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Controller
                      name="termMonths"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="account-creation-form-term-months">
                            Term (months)
                          </FieldLabel>
                          <Input
                            {...field}
                            id="account-creation-form-term-months"
                            type="number"
                            className="text-xs"
                            placeholder="60"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="monthlyPayment"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="account-creation-form-monthly-payment">
                            Monthly payment
                          </FieldLabel>
                          <InputGroup>
                            <InputGroupInput
                              {...field}
                              id="account-creation-form-monthly-payment"
                              type="number"
                              step="0.01"
                              placeholder="450.00"
                              className="text-xs"
                            />
                            <InputGroupAddon>
                              <DollarSignIcon />
                            </InputGroupAddon>
                          </InputGroup>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Controller
                      name="startDate"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="account-creation-form-start-date">
                            Start date
                          </FieldLabel>
                          <Input
                            {...field}
                            id="account-creation-form-start-date"
                            type="date"
                            className="text-xs"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="maturityDate"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="account-creation-form-maturity-date">
                            Maturity date
                          </FieldLabel>
                          <Input
                            {...field}
                            id="account-creation-form-maturity-date"
                            type="date"
                            className="text-xs"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                </>
              )}

              {/* Mortgage: Payment Frequency, Term, Amortization, Start, Renewal, Monthly */}
              {type === "mortgage" && (
                <>
                  <Controller
                    name="paymentFrequency"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor="account-creation-form-payment-frequency">
                          Payment frequency
                        </FieldLabel>
                        <NativeSelect
                          id="account-creation-form-payment-frequency"
                          className="w-full"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || undefined)
                          }
                        >
                          <NativeSelectOption value="">
                            Select frequency…
                          </NativeSelectOption>
                          <NativeSelectOption value="monthly">
                            Monthly
                          </NativeSelectOption>
                          <NativeSelectOption value="biweekly">
                            Bi-weekly
                          </NativeSelectOption>
                          <NativeSelectOption value="accelerated_biweekly">
                            Accelerated bi-weekly
                          </NativeSelectOption>
                        </NativeSelect>
                      </Field>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Controller
                      name="termMonths"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="account-creation-form-term-months">
                            Term (months)
                          </FieldLabel>
                          <Input
                            {...field}
                            id="account-creation-form-term-months"
                            type="number"
                            className="text-xs"
                            placeholder="60"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="amortizationMonths"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="account-creation-form-amortization">
                            Amortization (months)
                          </FieldLabel>
                          <Input
                            {...field}
                            id="account-creation-form-amortization"
                            type="number"
                            className="text-xs"
                            placeholder="300"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                  <Controller
                    name="monthlyPayment"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="account-creation-form-monthly-payment">
                          Monthly payment
                        </FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            id="account-creation-form-monthly-payment"
                            type="number"
                            step="0.01"
                            placeholder="1850.00"
                            className="text-xs"
                          />
                          <InputGroupAddon>
                            <DollarSignIcon />
                          </InputGroupAddon>
                        </InputGroup>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Controller
                      name="startDate"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="account-creation-form-start-date">
                            Start date
                          </FieldLabel>
                          <Input
                            {...field}
                            id="account-creation-form-start-date"
                            type="date"
                            className="text-xs"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="renewalDate"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="account-creation-form-renewal-date">
                            Renewal date
                          </FieldLabel>
                          <Input
                            {...field}
                            id="account-creation-form-renewal-date"
                            type="date"
                            className="text-xs"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                </>
              )}

              {/* Asset: Purchase Price, Purchase Date, Location */}
              {type === "asset" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Controller
                      name="purchasePrice"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="account-creation-form-purchase-price">
                            Purchase price
                          </FieldLabel>
                          <InputGroup>
                            <InputGroupInput
                              {...field}
                              id="account-creation-form-purchase-price"
                              type="number"
                              step="0.01"
                              placeholder="35000.00"
                              className="text-xs"
                            />
                            <InputGroupAddon>
                              <DollarSignIcon />
                            </InputGroupAddon>
                          </InputGroup>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="purchaseDate"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="account-creation-form-purchase-date">
                            Purchase date
                          </FieldLabel>
                          <Input
                            {...field}
                            id="account-creation-form-purchase-date"
                            type="date"
                            className="text-xs"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                  <Controller
                    name="location"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="account-creation-form-asset-location">
                          Location
                        </FieldLabel>
                        <Input
                          {...field}
                          id="account-creation-form-asset-location"
                          className="text-xs"
                          placeholder="123 Main St, Toronto"
                          autoComplete="off"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </>
              )}
            </FieldGroup>
          </CollapsibleContent>
        </Collapsible>
      )}

      <div className="flex flex-col gap-2 pt-2">
        <Button
          type="submit"
          className="w-full"
          disabled={createAccount.isPending}
        >
          {createAccount.isPending ? "Creating..." : "Create account"}
        </Button>
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>
    </form>
  );
}
