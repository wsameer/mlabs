import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { toast } from "sonner";
import type { Transaction, TransactionType } from "@workspace/types";

import { useAccounts } from "@/features/accounts/api/use-accounts";
import { useCategories } from "@/features/categories/api/use-categories";
import { useUpdateTransaction } from "../../api/use-transactions";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import {
  InputGroup,
  InputGroupAddon,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { DollarSignIcon } from "lucide-react";

import { CategoryPicker } from "../create-transaction/components/category-picker";
import { MergeTransferPanel } from "./MergeTransferPanel";

// ---------------------------------------------------------------------------
// Schemas (form-level — backed by a single union form so we can switch type
// without remounting the dialog)
// ---------------------------------------------------------------------------

const EditFormSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    accountId: z.string().optional(),
    categoryId: z.string().optional(),
    subcategoryId: z.string().optional(),
    fromAccountId: z.string().optional(),
    toAccountId: z.string().optional(),
    amount: z.string().min(1, "Amount is required"),
    description: z.string().max(200).optional(),
    notes: z.string().optional(),
    date: z.string().min(1, "Date is required"),
    isCleared: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.type === "TRANSFER") {
      if (!data.fromAccountId) {
        ctx.addIssue({
          code: "custom",
          path: ["fromAccountId"],
          message: "Source account is required",
        });
      }
      if (!data.toAccountId) {
        ctx.addIssue({
          code: "custom",
          path: ["toAccountId"],
          message: "Destination account is required",
        });
      }
      if (
        data.fromAccountId &&
        data.toAccountId &&
        data.fromAccountId === data.toAccountId
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["toAccountId"],
          message: "Must be different from source account",
        });
      }
    } else {
      if (!data.accountId) {
        ctx.addIssue({
          code: "custom",
          path: ["accountId"],
          message: "Account is required",
        });
      }
      if (!data.categoryId) {
        ctx.addIssue({
          code: "custom",
          path: ["categoryId"],
          message: "Category is required",
        });
      }
    }
  });

type EditFormValues = z.infer<typeof EditFormSchema>;

// ---------------------------------------------------------------------------
// Defaults derived from the transaction being edited
// ---------------------------------------------------------------------------

function buildInitialDefaults(transaction: Transaction): EditFormValues {
  if (transaction.type === "TRANSFER") {
    const isOutflow = transaction.direction === "OUTFLOW";
    return {
      type: "TRANSFER",
      accountId: undefined,
      categoryId: undefined,
      subcategoryId: undefined,
      fromAccountId: isOutflow
        ? transaction.accountId
        : (transaction.linkedAccountId ?? ""),
      toAccountId: isOutflow
        ? (transaction.linkedAccountId ?? "")
        : transaction.accountId,
      amount: transaction.amount,
      description: transaction.description ?? "",
      notes: transaction.notes ?? "",
      date: transaction.date,
      isCleared: transaction.isCleared,
    };
  }

  return {
    type: transaction.type,
    accountId: transaction.accountId,
    categoryId: transaction.categoryId ?? "",
    subcategoryId: transaction.subcategoryId ?? undefined,
    fromAccountId: undefined,
    toAccountId: undefined,
    amount: transaction.amount,
    description: transaction.description ?? "",
    notes: transaction.notes ?? "",
    date: transaction.date,
    isCleared: transaction.isCleared,
  };
}

// ---------------------------------------------------------------------------
// Carry-over rules when the user toggles the transaction type within the dialog
// ---------------------------------------------------------------------------

function applyTypeChange(
  current: EditFormValues,
  nextType: TransactionType
): EditFormValues {
  if (current.type === nextType) return current;

  const shared = {
    amount: current.amount,
    description: current.description,
    notes: current.notes,
    date: current.date,
    isCleared: current.isCleared,
  };

  if (nextType === "TRANSFER") {
    // Coming from INCOME/EXPENSE: route current account into the matching leg.
    const fromAccountId =
      current.type === "EXPENSE" ? current.accountId : undefined;
    const toAccountId =
      current.type === "INCOME" ? current.accountId : undefined;

    return {
      ...shared,
      type: "TRANSFER",
      accountId: undefined,
      categoryId: undefined,
      subcategoryId: undefined,
      fromAccountId,
      toAccountId,
    };
  }

  // Going to INCOME or EXPENSE.
  let nextAccountId: string | undefined;
  if (current.type === "TRANSFER") {
    // Use whichever leg was filled; prefer the from-side for EXPENSE and the
    // to-side for INCOME so the user keeps the most relevant account.
    nextAccountId =
      nextType === "EXPENSE"
        ? (current.fromAccountId ?? current.toAccountId)
        : (current.toAccountId ?? current.fromAccountId);
  } else {
    nextAccountId = current.accountId;
  }

  return {
    ...shared,
    type: nextType,
    accountId: nextAccountId,
    // Category type-specific: clear when switching between INCOME and EXPENSE.
    categoryId: undefined,
    subcategoryId: undefined,
    fromAccountId: undefined,
    toAccountId: undefined,
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onDelete?: (transaction: Transaction) => void;
}

// ---------------------------------------------------------------------------
// Dialog wrapper
// ---------------------------------------------------------------------------

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onDelete,
}: Props) {
  const handleDelete =
    onDelete && transaction ? () => onDelete(transaction) : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-131.25" data-testid="tx-edit-dialog">
        <DialogHeader>
          <DialogTitle className="text-left">Edit transaction</DialogTitle>
          <DialogDescription className="text-left">
            Editing transaction. Switch the type above to convert it.
          </DialogDescription>
        </DialogHeader>
        {transaction && (
          <EditTransactionForm
            // Re-mount per transaction so the form picks up fresh defaults.
            key={transaction.id}
            transaction={transaction}
            onClose={() => onOpenChange(false)}
            onDelete={handleDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Inner form
// ---------------------------------------------------------------------------

function EditTransactionForm({
  transaction,
  onClose,
  onDelete,
}: {
  transaction: Transaction;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const updateTransaction = useUpdateTransaction();
  const { data: accounts } = useAccounts({ isActive: true });

  const initialType = transaction.type;
  const [currentType, setCurrentType] = useState<TransactionType>(initialType);

  const form = useForm<EditFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(EditFormSchema) as any,
    mode: "onChange",
    defaultValues: useMemo(
      () => buildInitialDefaults(transaction),
      [transaction]
    ),
  });

  // Categories are scoped to whichever income/expense type is currently
  // selected. Skip the query entirely while the form is in TRANSFER mode.
  const categoryType: "INCOME" | "EXPENSE" =
    currentType === "INCOME" ? "INCOME" : "EXPENSE";
  const { data: categories } = useCategories({
    type: categoryType,
    isActive: true,
  });

  const subcategoryId = useWatch({
    control: form.control,
    name: "subcategoryId",
  });

  function handleTypeChange(nextType: TransactionType) {
    if (nextType === currentType) return;
    const next = applyTypeChange(form.getValues(), nextType);
    setCurrentType(nextType);
    form.reset(next, { keepDirty: true, keepTouched: true });
  }

  function onSubmit(data: EditFormValues) {
    const isTypeChanged = data.type !== transaction.type;

    const payload: Record<string, unknown> = {
      amount: data.amount,
      date: data.date,
      description: data.description || undefined,
      notes: data.notes || undefined,
      isCleared: data.isCleared,
    };

    if (data.type === "TRANSFER") {
      payload.fromAccountId = data.fromAccountId;
      payload.toAccountId = data.toAccountId;
    } else {
      payload.accountId = data.accountId;
      payload.categoryId = data.categoryId;
      payload.subcategoryId = data.subcategoryId || null;
    }

    if (isTypeChanged) {
      payload.type = data.type;
    }

    updateTransaction.mutate(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: transaction.id, data: payload as any },
      {
        onSuccess: () => {
          toast.success(
            data.type === "TRANSFER"
              ? "Transfer updated"
              : "Transaction updated"
          );
          onClose();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update transaction");
        },
      }
    );
  }

  const showMergeTransferPanel =
    currentType !== "TRANSFER" &&
    transaction.type !== "TRANSFER" &&
    !!transaction.transferId;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      {/* Type toggle */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Type</span>
        <ToggleGroup
          value={[currentType]}
          onValueChange={(next) => {
            if (!next.length) return;
            handleTypeChange(next[0] as TransactionType);
          }}
          disabled={updateTransaction.isPending}
          spacing={2}
          variant="outline"
          size="sm"
          aria-label="Transaction type"
        >
          <ToggleGroupItem
            value="INCOME"
            className="text-xs"
            data-testid="tx-edit-type-income"
            aria-label="Income"
          >
            Income
          </ToggleGroupItem>
          <ToggleGroupItem
            value="EXPENSE"
            className="text-xs"
            data-testid="tx-edit-type-expense"
            aria-label="Expense"
          >
            Expense
          </ToggleGroupItem>
          <ToggleGroupItem
            value="TRANSFER"
            className="text-xs"
            data-testid="tx-edit-type-transfer"
            aria-label="Transfer"
          >
            Transfer
          </ToggleGroupItem>
        </ToggleGroup>
        {currentType === "TRANSFER" && (
          <span className="text-xs text-muted-foreground">
            Both sides will be updated
          </span>
        )}
      </div>

      <FieldGroup>
        {showMergeTransferPanel && (
          <MergeTransferPanel
            transaction={transaction}
            accounts={accounts}
            onMerged={onClose}
          />
        )}

        {currentType === "TRANSFER" ? (
          <>
            {/* From account */}
            <Controller
              name="fromAccountId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-tx-from-account">
                    From account
                  </FieldLabel>
                  <NativeSelect
                    id="edit-tx-from-account"
                    className="w-full"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    data-testid="tx-edit-from-account"
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

            {/* To account */}
            <Controller
              name="toAccountId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-tx-to-account">
                    To account
                  </FieldLabel>
                  <NativeSelect
                    id="edit-tx-to-account"
                    className="w-full"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    data-testid="tx-edit-to-account"
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
          </>
        ) : (
          <Controller
            name="accountId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="edit-tx-account">Account</FieldLabel>
                <NativeSelect
                  id="edit-tx-account"
                  className="w-full"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  data-testid="tx-edit-account"
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
        )}

        {/* Amount + Date row (shared) */}
        <div className="grid grid-cols-2 gap-3">
          <Controller
            name="amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="edit-tx-amount">Amount</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="edit-tx-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="text-xs"
                    data-testid="tx-edit-amount"
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

          <Field data-invalid={!!form.formState.errors.date}>
            <FieldLabel htmlFor="edit-tx-date">Date</FieldLabel>
            <Input
              id="edit-tx-date"
              type="date"
              {...form.register("date")}
              className="text-xs"
              data-testid="tx-edit-date"
            />
            {form.formState.errors.date && (
              <FieldError>{form.formState.errors.date.message}</FieldError>
            )}
          </Field>
        </div>

        {/* Category — only for INCOME / EXPENSE */}
        {currentType !== "TRANSFER" && (
          <Controller
            name="categoryId"
            control={form.control}
            render={({ field, fieldState }) => {
              const value = field.value
                ? { categoryId: field.value, subcategoryId }
                : null;
              return (
                <CategoryPicker
                  id="edit-tx-category"
                  label="Category"
                  categories={categories}
                  value={value}
                  onChange={(next) => {
                    form.setValue("categoryId", next.categoryId, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                    form.setValue("subcategoryId", next.subcategoryId, {
                      shouldDirty: true,
                    });
                  }}
                  error={fieldState.error?.message}
                  testId="tx-edit-category"
                />
              );
            }}
          />
        )}

        {/* Description */}
        <Field>
          <FieldLabel htmlFor="edit-tx-description">Description</FieldLabel>
          <Input
            id="edit-tx-description"
            {...form.register("description")}
            autoComplete="off"
            className="text-xs"
            data-testid="tx-edit-description"
          />
        </Field>

        {/* Notes */}
        <Field>
          <FieldLabel htmlFor="edit-tx-notes">Notes</FieldLabel>
          <Textarea
            id="edit-tx-notes"
            {...form.register("notes")}
            rows={2}
            className="text-xs"
            data-testid="tx-edit-notes"
          />
        </Field>
      </FieldGroup>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onDelete && (
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            className="mr-auto"
            data-testid="tx-edit-delete"
          >
            Delete
          </Button>
        )}
        <Button
          type="submit"
          disabled={updateTransaction.isPending}
          data-testid="tx-edit-save"
        >
          {updateTransaction.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
