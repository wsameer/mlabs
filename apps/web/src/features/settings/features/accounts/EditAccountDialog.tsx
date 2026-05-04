import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { toast } from "sonner";
import type { Account, AccountGroupType } from "@workspace/types";
import { useUpdateAccount } from "@/features/accounts/api/use-accounts";
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

const EditAccountFormSchema = z.object({
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
  creditLimit: z.string().optional(),
  originalAmount: z.string().optional(),
  interestRate: z.string().optional(),
  isActive: z.boolean().default(true),
  includeInNetWorth: z.boolean().default(true),
  notes: z.string().optional(),
  // Metadata fields
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

type EditAccountFormData = z.infer<typeof EditAccountFormSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
}

export function EditAccountDialog({ open, onOpenChange, account }: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const updateAccount = useUpdateAccount();

  const form = useForm<EditAccountFormData>({
    // eslint-disable-next-line
    resolver: zodResolver(EditAccountFormSchema) as any,
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    if (account) {
      const meta = (account.metadata ?? {}) as Record<string, unknown>;
      form.reset({
        name: account.name,
        group: account.group,
        balance: account.balance,
        currency: account.currency ?? "CAD",
        institutionName: account.institutionName ?? "",
        accountNumber: account.accountNumber ?? "",
        description: account.description ?? "",
        creditLimit: account.creditLimit ?? "",
        originalAmount: account.originalAmount ?? "",
        interestRate: account.interestRate ?? "",
        isActive: account.isActive ?? true,
        includeInNetWorth: account.includeInNetWorth ?? true,
        notes: account.notes ?? "",
        investmentSubtype: (meta.subtype as string) ?? "",
        contributionRoom: (meta.contributionRoom as string) ?? "",
        loanType: (meta.loanType as string) ?? "",
        termMonths: meta.termMonths != null ? String(meta.termMonths) : "",
        startDate: (meta.startDate as string) ?? "",
        maturityDate: (meta.maturityDate as string) ?? "",
        monthlyPayment: (meta.monthlyPayment as string) ?? "",
        amortizationMonths:
          meta.amortizationMonths != null
            ? String(meta.amortizationMonths)
            : "",
        renewalDate: (meta.renewalDate as string) ?? "",
        paymentFrequency: (meta.paymentFrequency as string) ?? "",
        assetType: (meta.assetType as string) ?? "",
        purchaseDate: (meta.purchaseDate as string) ?? "",
        purchasePrice: (meta.purchasePrice as string) ?? "",
        location: (meta.location as string) ?? "",
      });
    }
  }, [account, form]);

  function handleClose() {
    onOpenChange(false);
  }

  function onSubmit(data: EditAccountFormData) {
    if (!account) return;

    const metadata = buildMetadata(data);

    updateAccount.mutate(
      {
        id: account.id,
        data: {
          name: data.name.trim(),
          group: data.group,
          balance: data.balance || undefined,
          currency: data.currency || undefined,
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
      },
      {
        onSuccess: () => {
          toast.success("Account updated");
          handleClose();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update account");
        },
      }
    );
  }

  const title = "Edit account";
  const description = "Update your account details.";

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <EditForm
            form={form}
            onSubmit={onSubmit}
            isPending={updateAccount.isPending}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <EditForm
          form={form}
          onSubmit={onSubmit}
          isPending={updateAccount.isPending}
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

function getDefaultValues(): EditAccountFormData {
  return {
    name: "",
    group: "chequing",
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
  };
}

function buildMetadata(data: EditAccountFormData): Record<string, unknown> {
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

interface EditFormProps {
  form: ReturnType<typeof useForm<EditAccountFormData>>;
  onSubmit: (data: EditAccountFormData) => void;
  isPending: boolean;
  className?: string;
}

function EditForm({ form, onSubmit, isPending, className }: EditFormProps) {
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
            <FieldLabel htmlFor="edit-account-name">Name</FieldLabel>
            <Input
              id="edit-account-name"
              {...form.register("name")}
              autoComplete="off"
              autoFocus
            />
            {form.formState.errors.name && (
              <FieldError>{form.formState.errors.name.message}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!form.formState.errors.group}>
            <FieldLabel htmlFor="edit-account-group">Group</FieldLabel>
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
              <FieldLabel htmlFor="edit-account-balance">Balance</FieldLabel>
              <Input
                id="edit-account-balance"
                {...form.register("balance")}
                placeholder="0.00"
                autoComplete="off"
                inputMode="decimal"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-account-currency">Currency</FieldLabel>
              <Input
                id="edit-account-currency"
                {...form.register("currency")}
                placeholder="CAD"
                autoComplete="off"
                maxLength={3}
              />
            </Field>
          </div>

          <FieldSeparator>Details</FieldSeparator>

          <Field>
            <FieldLabel htmlFor="edit-account-institution">
              Institution
            </FieldLabel>
            <Input
              id="edit-account-institution"
              {...form.register("institutionName")}
              placeholder="e.g. TD Bank"
              autoComplete="off"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-account-number">
              Account number (last 4)
            </FieldLabel>
            <Input
              id="edit-account-number"
              {...form.register("accountNumber")}
              placeholder="e.g. 1234"
              autoComplete="off"
              maxLength={50}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-account-description">
              Description
            </FieldLabel>
            <Input
              id="edit-account-description"
              {...form.register("description")}
              placeholder="Short description"
              autoComplete="off"
            />
          </Field>

          {/* Credit card fields */}
          {groupValue === "credit_card" && (
            <Field>
              <FieldLabel htmlFor="edit-account-credit-limit">
                Credit limit
              </FieldLabel>
              <Input
                id="edit-account-credit-limit"
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
                <FieldLabel htmlFor="edit-account-original-amount">
                  Original amount
                </FieldLabel>
                <Input
                  id="edit-account-original-amount"
                  {...form.register("originalAmount")}
                  placeholder="e.g. 250000"
                  autoComplete="off"
                  inputMode="decimal"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="edit-account-interest-rate">
                    Interest rate (%)
                  </FieldLabel>
                  <Input
                    id="edit-account-interest-rate"
                    {...form.register("interestRate")}
                    placeholder="e.g. 5.25"
                    autoComplete="off"
                    inputMode="decimal"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-account-term-months">
                    Term (months)
                  </FieldLabel>
                  <Input
                    id="edit-account-term-months"
                    {...form.register("termMonths")}
                    placeholder="e.g. 60"
                    autoComplete="off"
                    inputMode="numeric"
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="edit-account-monthly-payment">
                  Monthly payment
                </FieldLabel>
                <Input
                  id="edit-account-monthly-payment"
                  {...form.register("monthlyPayment")}
                  placeholder="e.g. 1500"
                  autoComplete="off"
                  inputMode="decimal"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="edit-account-start-date">
                    Start date
                  </FieldLabel>
                  <Input
                    id="edit-account-start-date"
                    type="date"
                    {...form.register("startDate")}
                    autoComplete="off"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-account-end-date">
                    {groupValue === "mortgage"
                      ? "Renewal date"
                      : "Maturity date"}
                  </FieldLabel>
                  <Input
                    id="edit-account-end-date"
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
              <FieldLabel htmlFor="edit-account-loan-type">
                Loan type
              </FieldLabel>
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
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="edit-account-amortization">
                  Amortization (months)
                </FieldLabel>
                <Input
                  id="edit-account-amortization"
                  {...form.register("amortizationMonths")}
                  placeholder="e.g. 300"
                  autoComplete="off"
                  inputMode="numeric"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-account-pay-frequency">
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
          )}

          {/* Investment-specific */}
          {groupValue === "investment" && (
            <>
              <FieldSeparator>Investment details</FieldSeparator>
              <Field>
                <FieldLabel htmlFor="edit-account-inv-subtype">
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
                <FieldLabel htmlFor="edit-account-contribution-room">
                  Contribution room
                </FieldLabel>
                <Input
                  id="edit-account-contribution-room"
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
                <FieldLabel htmlFor="edit-account-asset-type">
                  Asset type
                </FieldLabel>
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
                  <FieldLabel htmlFor="edit-account-purchase-date">
                    Purchase date
                  </FieldLabel>
                  <Input
                    id="edit-account-purchase-date"
                    type="date"
                    {...form.register("purchaseDate")}
                    autoComplete="off"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-account-purchase-price">
                    Purchase price
                  </FieldLabel>
                  <Input
                    id="edit-account-purchase-price"
                    {...form.register("purchasePrice")}
                    placeholder="e.g. 450000"
                    autoComplete="off"
                    inputMode="decimal"
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="edit-account-asset-location">
                  Location
                </FieldLabel>
                <Input
                  id="edit-account-asset-location"
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
              <FieldLabel htmlFor="edit-account-cash-location">
                Location
              </FieldLabel>
              <Input
                id="edit-account-cash-location"
                {...form.register("location")}
                placeholder="e.g. Home safe"
                autoComplete="off"
              />
            </Field>
          )}

          <FieldSeparator>Options</FieldSeparator>

          <Field orientation="horizontal">
            <Checkbox
              checked={form.watch("isActive")}
              onCheckedChange={(checked) =>
                form.setValue("isActive", checked as boolean)
              }
            />
            <FieldContent>
              <FieldTitle>Active</FieldTitle>
              <FieldDescription>
                Inactive accounts are hidden from most views
              </FieldDescription>
            </FieldContent>
          </Field>

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
            <FieldLabel htmlFor="edit-account-notes">Notes</FieldLabel>
            <Input
              id="edit-account-notes"
              {...form.register("notes")}
              placeholder="Any additional notes"
              autoComplete="off"
            />
          </Field>
        </FieldGroup>
      </ScrollArea>
      <div className="flex justify-end gap-2 md:hidden">
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="hidden justify-end gap-2 md:flex">
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
