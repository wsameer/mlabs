import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { toast } from "sonner";
import type { Transaction, CategoryWithSubcategories } from "@workspace/types";

import { useAccounts } from "@/features/accounts/api/use-accounts";
import { useCategories } from "@/features/categories/api/use-categories";
import { useUpdateTransaction } from "../api/use-transactions";
import { useMediaQuery } from "@/hooks/use-media-query";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Badge } from "@workspace/ui/components/badge";
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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { DollarSignIcon } from "lucide-react";

import { CategoryPicker } from "../create-transaction/components/category-picker";

// ---------------------------------------------------------------------------
// Schemas (edit-only — no type field, type cannot change)
// ---------------------------------------------------------------------------

const EditIncomeExpenseSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().min(1, "Category is required"),
  subcategoryId: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().max(200).optional(),
  notes: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  isCleared: z.boolean().default(false),
});

const EditTransferSchema = z
  .object({
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

type EditIncomeExpenseValues = z.infer<typeof EditIncomeExpenseSchema>;
type EditTransferValues = z.infer<typeof EditTransferSchema>;

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
// Component
// ---------------------------------------------------------------------------

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onDelete,
}: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const title = "Edit transaction";
  const description = transaction
    ? `Editing ${transaction.type.toLowerCase()} transaction. Type cannot be changed.`
    : "";

  const handleDelete =
    onDelete && transaction ? () => onDelete(transaction) : undefined;

  const content = transaction ? (
    transaction.type === "TRANSFER" ? (
      <EditTransferForm
        transaction={transaction}
        onClose={() => onOpenChange(false)}
        onDelete={handleDelete}
      />
    ) : (
      <EditIncomeExpenseForm
        transaction={transaction}
        onClose={() => onOpenChange(false)}
        onDelete={handleDelete}
      />
    )
  ) : null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-131.25" data-testid="tx-edit-dialog">
          <DialogHeader>
            <DialogTitle className="text-left">{title}</DialogTitle>
            <DialogDescription className="text-left">
              {description}
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen, eventDetails) => {
        // Clicks inside nested popovers (category picker, calendar) portal
        // outside the sheet's DOM tree, which Base UI treats as an outside
        // press and would otherwise close the sheet. Ignore those.
        if (!nextOpen && eventDetails?.reason === "outside-press") return;
        onOpenChange(nextOpen);
      }}
    >
      <SheetContent
        side="bottom"
        className="max-h-[90svh] overflow-y-auto rounded-t-xl"
        data-testid="tx-edit-dialog"
      >
        <SheetHeader>
          <SheetTitle className="text-left">{title}</SheetTitle>
          <SheetDescription className="text-left">
            {description}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-2">{content}</div>
        <SheetFooter className="pt-2">
          <SheetClose
            render={
              <Button variant="outline" data-testid="tx-edit-cancel">
                Cancel
              </Button>
            }
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Income / Expense Edit Form
// ---------------------------------------------------------------------------

function EditIncomeExpenseForm({
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
  const { data: categories } = useCategories({
    type: transaction.type as "INCOME" | "EXPENSE",
    isActive: true,
  });

  const form = useForm<EditIncomeExpenseValues>({
    // eslint-disable-next-line
    resolver: zodResolver(EditIncomeExpenseSchema) as any,
    mode: "onChange",
    defaultValues: {
      accountId: "",
      categoryId: "",
      subcategoryId: undefined,
      amount: "",
      description: "",
      notes: "",
      date: "",
      isCleared: false,
    },
  });

  // Transactions store only a single categoryId. If that id points to a
  // subcategory, seed the picker with parentId=<parent> + subcategoryId=<id>
  // so the trigger renders the full context.
  useEffect(() => {
    if (!transaction) return;
    const id = transaction.categoryId ?? "";
    let seededCategoryId = id;
    let seededSubcategoryId: string | undefined = undefined;
    if (id && categories) {
      for (const parent of categories as CategoryWithSubcategories[]) {
        const sub = parent.subcategories?.find((s) => s.id === id);
        if (sub) {
          seededCategoryId = parent.id;
          seededSubcategoryId = sub.id;
          break;
        }
      }
    }
    form.reset({
      accountId: transaction.accountId,
      categoryId: seededCategoryId,
      subcategoryId: seededSubcategoryId,
      amount: transaction.amount,
      description: transaction.description ?? "",
      notes: transaction.notes ?? "",
      date: transaction.date,
      isCleared: transaction.isCleared,
    });
  }, [transaction, form, categories]);

  const subcategoryId = useWatch({
    control: form.control,
    name: "subcategoryId",
  });

  function onSubmit(data: EditIncomeExpenseValues) {
    updateTransaction.mutate(
      {
        id: transaction.id,
        data: {
          accountId: data.accountId,
          categoryId: data.subcategoryId || data.categoryId,
          amount: data.amount,
          description: data.description || undefined,
          notes: data.notes || undefined,
          date: data.date,
          isCleared: data.isCleared,
        },
      },
      {
        onSuccess: () => {
          toast.success("Transaction updated");
          onClose();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update transaction");
        },
      }
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      {/* Type badge — read-only guard */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Type</span>
        <Badge variant="secondary" className="pointer-events-none capitalize">
          {transaction.type.toLowerCase()}
        </Badge>
      </div>

      <FieldGroup>
        {/* Account */}
        <Controller
          name="accountId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="edit-tx-account">Account</FieldLabel>
              <NativeSelect
                id="edit-tx-account"
                className="w-full"
                value={field.value}
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

        {/* Amount + Date row */}
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

        {/* Category */}
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
      <div className="flex justify-between gap-2 md:hidden">
        {onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete} data-testid="tx-edit-delete">
            Delete
          </Button>
        )}
        <Button
          type="submit"
          disabled={updateTransaction.isPending}
          className="flex-1"
          data-testid="tx-edit-save"
        >
          {updateTransaction.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
      <div className="hidden justify-end gap-2 md:flex">
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
        <Button type="submit" disabled={updateTransaction.isPending} data-testid="tx-edit-save">
          {updateTransaction.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Transfer Edit Form
// ---------------------------------------------------------------------------

function EditTransferForm({
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

  const form = useForm<EditTransferValues>({
    // eslint-disable-next-line
    resolver: zodResolver(EditTransferSchema) as any,
    mode: "onChange",
    defaultValues: {
      fromAccountId: "",
      toAccountId: "",
      amount: "",
      description: "",
      notes: "",
      date: "",
      isCleared: false,
    },
  });

  useEffect(() => {
    if (transaction) {
      form.reset({
        fromAccountId:
          transaction.direction === "OUTFLOW"
            ? transaction.accountId
            : (transaction.linkedAccountId ?? ""),
        toAccountId:
          transaction.direction === "INFLOW"
            ? transaction.accountId
            : (transaction.linkedAccountId ?? ""),
        amount: transaction.amount,
        description: transaction.description ?? "",
        notes: transaction.notes ?? "",
        date: transaction.date,
        isCleared: transaction.isCleared,
      });
    }
  }, [transaction, form]);

  function onSubmit(data: EditTransferValues) {
    updateTransaction.mutate(
      {
        id: transaction.id,
        data: {
          fromAccountId: data.fromAccountId,
          toAccountId: data.toAccountId,
          amount: data.amount,
          description: data.description || undefined,
          notes: data.notes || undefined,
          date: data.date,
          isCleared: data.isCleared,
        },
      },
      {
        onSuccess: () => {
          toast.success("Transfer updated");
          onClose();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update transfer");
        },
      }
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      {/* Type badge — read-only guard */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Type</span>
        <Badge variant="secondary" className="pointer-events-none capitalize">
          transfer
        </Badge>
        <span className="text-xs text-muted-foreground">
          Both sides will be updated
        </span>
      </div>

      <FieldGroup>
        {/* From Account */}
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
                value={field.value}
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

        {/* To Account */}
        <Controller
          name="toAccountId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="edit-tx-to-account">To account</FieldLabel>
              <NativeSelect
                id="edit-tx-to-account"
                className="w-full"
                value={field.value}
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

        {/* Amount + Date row */}
        <div className="grid grid-cols-2 gap-3">
          <Controller
            name="amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="edit-tx-transfer-amount">
                  Amount
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="edit-tx-transfer-amount"
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
            <FieldLabel htmlFor="edit-tx-transfer-date">Date</FieldLabel>
            <Input
              id="edit-tx-transfer-date"
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

        {/* Description */}
        <Field>
          <FieldLabel htmlFor="edit-tx-transfer-description">
            Description
          </FieldLabel>
          <Input
            id="edit-tx-transfer-description"
            {...form.register("description")}
            autoComplete="off"
            className="text-xs"
            data-testid="tx-edit-description"
          />
        </Field>

        {/* Notes */}
        <Field>
          <FieldLabel htmlFor="edit-tx-transfer-notes">Notes</FieldLabel>
          <Textarea
            id="edit-tx-transfer-notes"
            {...form.register("notes")}
            rows={2}
            className="text-xs"
            data-testid="tx-edit-notes"
          />
        </Field>
      </FieldGroup>

      {/* Actions */}
      <div className="flex justify-between gap-2 md:hidden">
        {onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete} data-testid="tx-edit-delete">
            Delete
          </Button>
        )}
        <Button
          type="submit"
          disabled={updateTransaction.isPending}
          className="flex-1"
          data-testid="tx-edit-save"
        >
          {updateTransaction.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
      <div className="hidden justify-end gap-2 md:flex">
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
        <Button type="submit" disabled={updateTransaction.isPending} data-testid="tx-edit-save">
          {updateTransaction.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
