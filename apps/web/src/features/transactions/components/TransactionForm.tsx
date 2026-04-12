import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { toast } from "sonner";
import type { TransactionType } from "@workspace/types";

import { useAccounts } from "@/features/accounts/api/use-accounts";
import { useCategories } from "@/features/categories/api/use-categories";
import { useCreateTransaction } from "../api/use-transactions";
import { useUiActions } from "@/hooks/use-ui-store";

import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/ui/components/input-group";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Calendar } from "@workspace/ui/components/calendar";
import { CalendarIcon, DollarSignIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const IncomeExpenseFormSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().min(1, "Category is required"),
  subcategoryId: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().max(200).optional(),
  notes: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  isCleared: z.boolean().default(false),
});

const TransferFormSchema = z
  .object({
    type: z.literal("TRANSFER"),
    fromAccountId: z.string().min(1, "Source account is required"),
    toAccountId: z.string().min(1, "Destination account is required"),
    amount: z.string().min(1, "Amount is required"),
    description: z.string().max(200).optional(),
    notes: z.string().optional(),
    date: z.string().min(1, "Date is required"),
    isCleared: z.boolean().default(false),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "Must be different from source account",
    path: ["toAccountId"],
  });

type IncomeExpenseFormValues = z.infer<typeof IncomeExpenseFormSchema>;
type TransferFormValues = z.infer<typeof TransferFormSchema>;

// ---------------------------------------------------------------------------
// Date Picker Field
// ---------------------------------------------------------------------------

/** Parse YYYY-MM-DD to a local Date (avoids timezone shift from new Date("YYYY-MM-DD")) */
function parseLocalDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Format Date to YYYY-MM-DD */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Format Date for display in the input */
function formatDisplayDate(date: Date | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(date: Date | undefined): boolean {
  return !!date && !isNaN(date.getTime());
}

interface DatePickerFieldProps {
  id: string;
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  error?: string;
}

function DatePickerField({
  id,
  label,
  value,
  onChange,
  error,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseLocalDate(value);
  const [month, setMonth] = useState<Date | undefined>(selectedDate);
  const [displayValue, setDisplayValue] = useState(
    formatDisplayDate(selectedDate)
  );

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          value={displayValue}
          placeholder="January 01, 2026"
          className="text-xs"
          onChange={(e) => {
            setDisplayValue(e.target.value);
            const parsed = new Date(e.target.value);
            if (isValidDate(parsed)) {
              onChange(toDateString(parsed));
              setMonth(parsed);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              render={
                <InputGroupButton
                  variant="ghost"
                  aria-label="Select date"
                >
                  <CalendarIcon />
                </InputGroupButton>
              }
            />
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="end"
              alignOffset={-8}
              sideOffset={10}
            >
              <Calendar
                mode="single"
                selected={selectedDate}
                month={month}
                onMonthChange={setMonth}
                onSelect={(date) => {
                  if (date) {
                    onChange(toDateString(date));
                    setDisplayValue(formatDisplayDate(date));
                  }
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TransactionFormProps {
  type: TransactionType;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TransactionForm({ type, className }: TransactionFormProps) {
  if (type === "TRANSFER") {
    return <TransferForm className={className} />;
  }
  return <IncomeExpenseForm type={type} className={className} />;
}

// ---------------------------------------------------------------------------
// Income / Expense Form
// ---------------------------------------------------------------------------

function IncomeExpenseForm({
  type,
  className,
}: {
  type: "INCOME" | "EXPENSE";
  className?: string;
}) {
  const createTransaction = useCreateTransaction();
  const { setOpenCreateTransaction } = useUiActions();
  const { data: accounts } = useAccounts({ isActive: true });
  const { data: categories } = useCategories({
    type,
    isActive: true,
  });

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<IncomeExpenseFormValues>({
    resolver: zodResolver(IncomeExpenseFormSchema) as any,
    mode: "onChange",
    defaultValues: {
      type,
      accountId: "",
      categoryId: "",
      subcategoryId: undefined,
      amount: "",
      description: "",
      notes: "",
      date: today,
      isCleared: false,
    },
  });

  // Separate parent categories and subcategories
  const parentCategories = categories?.filter((c) => !c.parentId) ?? [];
  const selectedCategoryId = form.watch("categoryId");
  const subcategories =
    categories?.filter((c) => c.parentId === selectedCategoryId) ?? [];

  function onSubmit(data: IncomeExpenseFormValues) {
    createTransaction.mutate(
      {
        type: data.type,
        accountId: data.accountId,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId || undefined,
        amount: data.amount,
        description: data.description || undefined,
        notes: data.notes || undefined,
        date: data.date,
        isCleared: data.isCleared,
      },
      {
        onSuccess: () => {
          toast.success(`${type === "INCOME" ? "Income" : "Expense"} recorded`);
          form.reset();
          setOpenCreateTransaction(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create transaction");
        },
      }
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-4", className)}
    >
      <FieldGroup>
        {/* Account */}
        <Controller
          name="accountId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="tx-account">Account</FieldLabel>
              <NativeSelect
                id="tx-account"
                className="w-full"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              >
                <NativeSelectOption value="">
                  Select account...
                </NativeSelectOption>
                {accounts?.map((account) => (
                  <NativeSelectOption key={account.id} value={account.id}>
                    {account.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </Field>
          )}
        />

        {/* Amount + Date row */}
        <div className="grid grid-cols-2 gap-3">
          <Controller
            name="amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="tx-amount">Amount</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="tx-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="text-xs"
                  />
                  <InputGroupAddon>
                    <DollarSignIcon />
                  </InputGroupAddon>
                </InputGroup>
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Field>
            )}
          />

          <Controller
            name="date"
            control={form.control}
            render={({ field, fieldState }) => (
              <DatePickerField
                id="tx-date"
                label="Date"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>

        {/* Category */}
        <Controller
          name="categoryId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="tx-category">Category</FieldLabel>
              <NativeSelect
                id="tx-category"
                className="w-full"
                value={field.value}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  // Reset subcategory when category changes
                  form.setValue("subcategoryId", undefined);
                }}
              >
                <NativeSelectOption value="">
                  Select category...
                </NativeSelectOption>
                {parentCategories.map((cat) => (
                  <NativeSelectOption key={cat.id} value={cat.id}>
                    {cat.icon ? `${cat.icon} ` : ""}
                    {cat.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </Field>
          )}
        />

        {/* Subcategory — only shown when parent category has children */}
        {subcategories.length > 0 && (
          <Controller
            name="subcategoryId"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="tx-subcategory">Subcategory</FieldLabel>
                <NativeSelect
                  id="tx-subcategory"
                  className="w-full"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || undefined)}
                >
                  <NativeSelectOption value="">None</NativeSelectOption>
                  {subcategories.map((sub) => (
                    <NativeSelectOption key={sub.id} value={sub.id}>
                      {sub.icon ? `${sub.icon} ` : ""}
                      {sub.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            )}
          />
        )}

        {/* Description */}
        <Field>
          <FieldLabel htmlFor="tx-description">Description</FieldLabel>
          <Input
            id="tx-description"
            {...form.register("description")}
            placeholder="e.g. Grocery shopping"
            autoComplete="off"
            className="text-xs"
          />
        </Field>

        {/* Notes */}
        <Field>
          <FieldLabel htmlFor="tx-notes">Notes</FieldLabel>
          <Textarea
            id="tx-notes"
            {...form.register("notes")}
            placeholder="Optional notes..."
            rows={2}
            className="text-xs"
          />
        </Field>
      </FieldGroup>

      {/* Submit */}
      <div className="flex justify-end gap-2 md:hidden">
        <Button
          type="submit"
          disabled={createTransaction.isPending}
          className="w-full"
        >
          {createTransaction.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
      <div className="hidden justify-end gap-2 md:flex">
        <Button type="submit" disabled={createTransaction.isPending}>
          {createTransaction.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Transfer Form
// ---------------------------------------------------------------------------

function TransferForm({ className }: { className?: string }) {
  const createTransaction = useCreateTransaction();
  const { setOpenCreateTransaction } = useUiActions();
  const { data: accounts } = useAccounts({ isActive: true });

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(TransferFormSchema) as any,
    mode: "onChange",
    defaultValues: {
      type: "TRANSFER",
      fromAccountId: "",
      toAccountId: "",
      amount: "",
      description: "",
      notes: "",
      date: today,
      isCleared: false,
    },
  });

  function onSubmit(data: TransferFormValues) {
    createTransaction.mutate(
      {
        type: "TRANSFER",
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: data.amount,
        description: data.description || undefined,
        notes: data.notes || undefined,
        date: data.date,
        isCleared: data.isCleared,
      },
      {
        onSuccess: () => {
          toast.success("Transfer recorded");
          form.reset();
          setOpenCreateTransaction(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create transfer");
        },
      }
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-4", className)}
    >
      <FieldGroup>
        {/* From Account */}
        <Controller
          name="fromAccountId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="tx-from-account">From account</FieldLabel>
              <NativeSelect
                id="tx-from-account"
                className="w-full"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              >
                <NativeSelectOption value="">
                  Select account...
                </NativeSelectOption>
                {accounts?.map((account) => (
                  <NativeSelectOption key={account.id} value={account.id}>
                    {account.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </Field>
          )}
        />

        {/* To Account */}
        <Controller
          name="toAccountId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="tx-to-account">To account</FieldLabel>
              <NativeSelect
                id="tx-to-account"
                className="w-full"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              >
                <NativeSelectOption value="">
                  Select account...
                </NativeSelectOption>
                {accounts?.map((account) => (
                  <NativeSelectOption key={account.id} value={account.id}>
                    {account.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </Field>
          )}
        />

        {/* Amount + Date row */}
        <div className="grid grid-cols-2 gap-3">
          <Controller
            name="amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="tx-transfer-amount">Amount</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="tx-transfer-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="text-xs"
                  />
                  <InputGroupAddon>
                    <DollarSignIcon />
                  </InputGroupAddon>
                </InputGroup>
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Field>
            )}
          />

          <Controller
            name="date"
            control={form.control}
            render={({ field, fieldState }) => (
              <DatePickerField
                id="tx-transfer-date"
                label="Date"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>

        {/* Description */}
        <Field>
          <FieldLabel htmlFor="tx-transfer-description">Description</FieldLabel>
          <Input
            id="tx-transfer-description"
            {...form.register("description")}
            placeholder="e.g. Move savings"
            autoComplete="off"
            className="text-xs"
          />
        </Field>

        {/* Notes */}
        <Field>
          <FieldLabel htmlFor="tx-transfer-notes">Notes</FieldLabel>
          <Textarea
            id="tx-transfer-notes"
            {...form.register("notes")}
            placeholder="Optional notes..."
            rows={2}
            className="text-xs"
          />
        </Field>
      </FieldGroup>

      {/* Submit */}
      <div className="flex justify-end gap-2 md:hidden">
        <Button
          type="submit"
          disabled={createTransaction.isPending}
          className="w-full"
        >
          {createTransaction.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
      <div className="hidden justify-end gap-2 md:flex">
        <Button type="submit" disabled={createTransaction.isPending}>
          {createTransaction.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
