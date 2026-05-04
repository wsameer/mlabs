import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { toast } from "sonner";
import type { AccountGroupType } from "@workspace/types";
import { useCreateAccount } from "@/features/accounts/api/use-accounts";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ACCOUNT_GROUP_METADATA } from "@/features/accounts/lib/account-groups";
import { cn } from "@workspace/ui/lib/utils";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldTitle,
} from "@workspace/ui/components/field";
import { ScrollArea } from "@workspace/ui/components/scroll-area";

const ACCOUNT_GROUPS: AccountGroupType[] = [
  "chequing",
  "savings",
  "cash",
  "credit_card",
  "investment",
  "loan",
  "mortgage",
  "asset",
  "other",
];

const INVESTMENT_SUBTYPES = [
  { value: "", label: "Select type..." },
  { value: "RRSP", label: "RRSP" },
  { value: "TFSA", label: "TFSA" },
  { value: "401k", label: "401(k)" },
  { value: "IRA", label: "IRA" },
  { value: "brokerage", label: "Brokerage" },
  { value: "other", label: "Other" },
] as const;

const LOAN_TYPES = [
  { value: "", label: "Select type..." },
  { value: "personal", label: "Personal" },
  { value: "auto", label: "Auto" },
  { value: "student", label: "Student" },
  { value: "line_of_credit", label: "Line of Credit" },
  { value: "other", label: "Other" },
] as const;

const MORTGAGE_FREQUENCIES = [
  { value: "", label: "Select..." },
  { value: "monthly", label: "Monthly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "accelerated_biweekly", label: "Accelerated Bi-weekly" },
] as const;

const ASSET_TYPES = [
  { value: "", label: "Select type..." },
  { value: "property", label: "Property" },
  { value: "vehicle", label: "Vehicle" },
  { value: "collectible", label: "Collectible" },
  { value: "jewelry", label: "Jewelry" },
  { value: "other", label: "Other" },
] as const;

const AddAccountFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  group: z.enum([
    "chequing",
    "savings",
    "cash",
    "credit_card",
    "investment",
    "loan",
    "mortgage",
    "asset",
    "other",
  ]),
  balance: z.string().optional(),
  currency: z.string().length(3).default("CAD"),
  institutionName: z.string().max(100).optional(),
  accountNumber: z.string().max(50).optional(),
  description: z.string().max(200).optional(),
  // Credit card
  creditLimit: z.string().optional(),
  // Loan / mortgage
  originalAmount: z.string().optional(),
  interestRate: z.string().optional(),
  // Flags
  isActive: z.boolean().default(true),
  includeInNetWorth: z.boolean().default(true),
  notes: z.string().optional(),
  // Metadata (varies by group)
  investmentSubtype: z.string().optional(),
  contributionRoom: z.string().optional(),
  loanType: z.string().optional(),
  termMonths: z.string().optional(),
  startDate: z.string().optional(),
  maturityDate: z.string().optional(),
  monthlyPayment: z.string().optional(),
  amortizationMonths: z.string().optional(),
  renewalDate: z.string().optional(),
  paymentFrequency: z.string().optional(),
  assetType: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.string().optional(),
  location: z.string().optional(),
});

type AddAccountFormData = z.infer<typeof AddAccountFormSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultGroup?: AccountGroupType;
}

export function AddAccountDialog({ open, onOpenChange, defaultGroup }: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const createAccount = useCreateAccount();

  const form = useForm<AddAccountFormData>({
    resolver: zodResolver(AddAccountFormSchema),
    defaultValues: {
      name: "",
      group: defaultGroup ?? "chequing",
      balance: "",
      currency: "CAD",
      institutionName: "",
      accountNumber: "",
      description: "",
      creditLimit: "",
      originalAmount: "",
      interestRate: "",
      isActive: true,
      includeInNetWorth: true,
      notes: "",
      investmentSubtype: "",
      contributionRoom: "",
      loanType: "",
      termMonths: "",
      startDate: "",
      maturityDate: "",
      monthlyPayment: "",
      amortizationMonths: "",
      renewalDate: "",
      paymentFrequency: "",
      assetType: "",
      purchaseDate: "",
      purchasePrice: "",
      location: "",
    },
  });

  function handleClose() {
    onOpenChange(false);
    form.reset();
  }

  function onSubmit(data: AddAccountFormData) {
    const metadata = buildMetadata(data);

    createAccount.mutate(
      {
        name: data.name.trim(),
        group: data.group,
        balance: data.balance || "0",
        currency: data.currency || "CAD",
        institutionName: data.institutionName?.trim() || undefined,
        accountNumber: data.accountNumber?.trim() || undefined,
        description: data.description?.trim() || undefined,
        creditLimit: data.creditLimit || undefined,
        originalAmount: data.originalAmount || undefined,
        interestRate: data.interestRate || undefined,
        isActive: data.isActive,
        includeInNetWorth: data.includeInNetWorth,
        notes: data.notes?.trim() || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Account created");
          handleClose();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to create account");
        },
      }
    );
  }

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  useEffect(() => {
    if (open && defaultGroup) {
      form.setValue("group", defaultGroup);
    }
  }, [open, defaultGroup, form]);

  const title = "Add account";
  const description = "Add a new account to track your finances.";

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <AccountForm
            form={form}
            onSubmit={onSubmit}
            isPending={createAccount.isPending}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-left">{title}</DrawerTitle>
          <DrawerDescription className="text-left">
            {description}
          </DrawerDescription>
        </DrawerHeader>
        <AccountForm
          form={form}
          onSubmit={onSubmit}
          isPending={createAccount.isPending}
          className="px-4"
        />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Build metadata object from flat form fields based on group type
function buildMetadata(data: AddAccountFormData): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  const g = data.group;

  if (g === "cash" && data.location) {
    meta.location = data.location.trim();
  }

  if (g === "investment") {
    if (data.investmentSubtype) meta.subtype = data.investmentSubtype;
    if (data.contributionRoom) meta.contributionRoom = data.contributionRoom;
  }

  if (g === "loan") {
    if (data.loanType) meta.loanType = data.loanType;
    if (data.termMonths) meta.termMonths = parseInt(data.termMonths, 10);
    if (data.startDate) meta.startDate = data.startDate;
    if (data.maturityDate) meta.maturityDate = data.maturityDate;
    if (data.monthlyPayment) meta.monthlyPayment = data.monthlyPayment;
  }

  if (g === "mortgage") {
    if (data.termMonths) meta.termMonths = parseInt(data.termMonths, 10);
    if (data.amortizationMonths)
      meta.amortizationMonths = parseInt(data.amortizationMonths, 10);
    if (data.startDate) meta.startDate = data.startDate;
    if (data.renewalDate) meta.renewalDate = data.renewalDate;
    if (data.monthlyPayment) meta.monthlyPayment = data.monthlyPayment;
    if (data.paymentFrequency) meta.paymentFrequency = data.paymentFrequency;
  }

  if (g === "asset") {
    if (data.assetType) meta.assetType = data.assetType;
    if (data.purchaseDate) meta.purchaseDate = data.purchaseDate;
    if (data.purchasePrice) meta.purchasePrice = data.purchasePrice;
    if (data.location) meta.location = data.location.trim();
  }

  return meta;
}

interface AccountFormProps {
  form: ReturnType<typeof useForm<AddAccountFormData>>;
  onSubmit: (data: AddAccountFormData) => void;
  isPending: boolean;
  className?: string;
}

function AccountForm({
  form,
  onSubmit,
  isPending,
  className,
}: AccountFormProps) {
  const groupValue = form.watch("group");

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-4", className)}
    >
      <ScrollArea className="max-h-[60vh]">
        <FieldGroup>
          {/* Core fields */}
          <Field data-invalid={!!form.formState.errors.name}>
            <FieldLabel htmlFor="account-name">Name</FieldLabel>
            <Input
              id="account-name"
              {...form.register("name")}
              placeholder="e.g. Main Chequing"
              autoComplete="off"
              autoFocus
            />
            {form.formState.errors.name && (
              <FieldError>{form.formState.errors.name.message}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!form.formState.errors.group}>
            <FieldLabel htmlFor="account-group">Group</FieldLabel>
            <NativeSelect
              className="w-full"
              value={groupValue}
              onChange={(e) =>
                form.setValue("group", e.target.value as AccountGroupType, {
                  shouldValidate: true,
                })
              }
            >
              {ACCOUNT_GROUPS.map((g) => (
                <NativeSelectOption key={g} value={g}>
                  {ACCOUNT_GROUP_METADATA[g].label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="account-balance">Opening balance</FieldLabel>
              <Input
                id="account-balance"
                {...form.register("balance")}
                placeholder="0.00"
                autoComplete="off"
                inputMode="decimal"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="account-currency">Currency</FieldLabel>
              <Input
                id="account-currency"
                {...form.register("currency")}
                placeholder="CAD"
                autoComplete="off"
                maxLength={3}
              />
            </Field>
          </div>

          <FieldSeparator>Details</FieldSeparator>

          <Field>
            <FieldLabel htmlFor="account-institution">Institution</FieldLabel>
            <Input
              id="account-institution"
              {...form.register("institutionName")}
              placeholder="e.g. TD Bank"
              autoComplete="off"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="account-number">
              Account number (last 4)
            </FieldLabel>
            <Input
              id="account-number"
              {...form.register("accountNumber")}
              placeholder="e.g. 1234"
              autoComplete="off"
              maxLength={50}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="account-description">Description</FieldLabel>
            <Input
              id="account-description"
              {...form.register("description")}
              placeholder="Short description"
              autoComplete="off"
            />
          </Field>

          {/* Credit card fields */}
          {groupValue === "credit_card" && (
            <Field>
              <FieldLabel htmlFor="account-credit-limit">
                Credit limit
              </FieldLabel>
              <Input
                id="account-credit-limit"
                {...form.register("creditLimit")}
                placeholder="e.g. 10000"
                autoComplete="off"
                inputMode="decimal"
              />
            </Field>
          )}

          {/* Loan / mortgage shared fields */}
          {(groupValue === "loan" || groupValue === "mortgage") && (
            <>
              <FieldSeparator>
                {groupValue === "loan" ? "Loan" : "Mortgage"} details
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="account-original-amount">
                  Original amount
                </FieldLabel>
                <Input
                  id="account-original-amount"
                  {...form.register("originalAmount")}
                  placeholder="e.g. 250000"
                  autoComplete="off"
                  inputMode="decimal"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="account-interest-rate">
                    Interest rate (%)
                  </FieldLabel>
                  <Input
                    id="account-interest-rate"
                    {...form.register("interestRate")}
                    placeholder="e.g. 5.25"
                    autoComplete="off"
                    inputMode="decimal"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="account-term-months">
                    Term (months)
                  </FieldLabel>
                  <Input
                    id="account-term-months"
                    {...form.register("termMonths")}
                    placeholder="e.g. 60"
                    autoComplete="off"
                    inputMode="numeric"
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="account-monthly-payment">
                  Monthly payment
                </FieldLabel>
                <Input
                  id="account-monthly-payment"
                  {...form.register("monthlyPayment")}
                  placeholder="e.g. 1500"
                  autoComplete="off"
                  inputMode="decimal"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="account-start-date">
                    Start date
                  </FieldLabel>
                  <Input
                    id="account-start-date"
                    type="date"
                    {...form.register("startDate")}
                    autoComplete="off"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="account-maturity-date">
                    {groupValue === "mortgage"
                      ? "Renewal date"
                      : "Maturity date"}
                  </FieldLabel>
                  <Input
                    id="account-maturity-date"
                    type="date"
                    {...form.register(
                      groupValue === "mortgage" ? "renewalDate" : "maturityDate"
                    )}
                    autoComplete="off"
                  />
                </Field>
              </div>
            </>
          )}

          {/* Loan-specific */}
          {groupValue === "loan" && (
            <Field>
              <FieldLabel htmlFor="account-loan-type">Loan type</FieldLabel>
              <NativeSelect
                className="w-full"
                value={form.watch("loanType") ?? ""}
                onChange={(e) => form.setValue("loanType", e.target.value)}
              >
                {LOAN_TYPES.map((t) => (
                  <NativeSelectOption key={t.value} value={t.value}>
                    {t.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          )}

          {/* Mortgage-specific */}
          {groupValue === "mortgage" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="account-amortization">
                    Amortization (months)
                  </FieldLabel>
                  <Input
                    id="account-amortization"
                    {...form.register("amortizationMonths")}
                    placeholder="e.g. 300"
                    autoComplete="off"
                    inputMode="numeric"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="account-pay-frequency">
                    Pay frequency
                  </FieldLabel>
                  <NativeSelect
                    className="w-full"
                    value={form.watch("paymentFrequency") ?? ""}
                    onChange={(e) =>
                      form.setValue("paymentFrequency", e.target.value)
                    }
                  >
                    {MORTGAGE_FREQUENCIES.map((f) => (
                      <NativeSelectOption key={f.value} value={f.value}>
                        {f.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
            </>
          )}

          {/* Investment-specific */}
          {groupValue === "investment" && (
            <>
              <FieldSeparator>Investment details</FieldSeparator>
              <Field>
                <FieldLabel htmlFor="account-inv-subtype">
                  Account type
                </FieldLabel>
                <NativeSelect
                  className="w-full"
                  value={form.watch("investmentSubtype") ?? ""}
                  onChange={(e) =>
                    form.setValue("investmentSubtype", e.target.value)
                  }
                >
                  {INVESTMENT_SUBTYPES.map((t) => (
                    <NativeSelectOption key={t.value} value={t.value}>
                      {t.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="account-contribution-room">
                  Contribution room
                </FieldLabel>
                <Input
                  id="account-contribution-room"
                  {...form.register("contributionRoom")}
                  placeholder="e.g. 6500"
                  autoComplete="off"
                  inputMode="decimal"
                />
              </Field>
            </>
          )}

          {/* Asset-specific */}
          {groupValue === "asset" && (
            <>
              <FieldSeparator>Asset details</FieldSeparator>
              <Field>
                <FieldLabel htmlFor="account-asset-type">Asset type</FieldLabel>
                <NativeSelect
                  className="w-full"
                  value={form.watch("assetType") ?? ""}
                  onChange={(e) => form.setValue("assetType", e.target.value)}
                >
                  {ASSET_TYPES.map((t) => (
                    <NativeSelectOption key={t.value} value={t.value}>
                      {t.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="account-purchase-date">
                    Purchase date
                  </FieldLabel>
                  <Input
                    id="account-purchase-date"
                    type="date"
                    {...form.register("purchaseDate")}
                    autoComplete="off"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="account-purchase-price">
                    Purchase price
                  </FieldLabel>
                  <Input
                    id="account-purchase-price"
                    {...form.register("purchasePrice")}
                    placeholder="e.g. 450000"
                    autoComplete="off"
                    inputMode="decimal"
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="account-asset-location">
                  Location
                </FieldLabel>
                <Input
                  id="account-asset-location"
                  {...form.register("location")}
                  placeholder="e.g. 123 Main St, Toronto"
                  autoComplete="off"
                />
              </Field>
            </>
          )}

          {/* Cash location */}
          {groupValue === "cash" && (
            <Field>
              <FieldLabel htmlFor="account-cash-location">Location</FieldLabel>
              <Input
                id="account-cash-location"
                {...form.register("location")}
                placeholder="e.g. Home safe"
                autoComplete="off"
              />
            </Field>
          )}

          <FieldSeparator>Options</FieldSeparator>

          <Field orientation="horizontal">
            <Checkbox
              checked={form.watch("includeInNetWorth")}
              onCheckedChange={(checked) =>
                form.setValue("includeInNetWorth", checked as boolean)
              }
            />
            <FieldContent>
              <FieldTitle>Include in net worth</FieldTitle>
              <FieldDescription>
                Count this account in net worth calculations
              </FieldDescription>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="account-notes">Notes</FieldLabel>
            <Input
              id="account-notes"
              {...form.register("notes")}
              placeholder="Any additional notes"
              autoComplete="off"
            />
          </Field>
        </FieldGroup>
      </ScrollArea>

      <div className="flex justify-end gap-2 md:hidden">
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Creating..." : "Create"}
        </Button>
      </div>

      <div className="hidden justify-end gap-2 md:flex">
        <Button type="submit" className={"w-full"} disabled={isPending}>
          {isPending ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
}
