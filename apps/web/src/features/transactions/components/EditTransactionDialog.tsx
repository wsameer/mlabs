import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { toast } from "sonner";
import type { Transaction } from "@workspace/types";

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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer";
import { DollarSignIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Schemas (edit-only — no type field, type cannot change)
// ---------------------------------------------------------------------------

const EditIncomeExpenseSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().min(1, "Category is required"),
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
        <DialogContent className="sm:max-w-131.25">
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-left">{title}</DrawerTitle>
          <DrawerDescription className="text-left">
            {description}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4">{content}</div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
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
    resolver: zodResolver(EditIncomeExpenseSchema) as any,
    mode: "onChange",
    defaultValues: {
      accountId: "",
      categoryId: "",
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
        accountId: transaction.accountId,
        categoryId: transaction.categoryId ?? "",
        amount: transaction.amount,
        description: transaction.description ?? "",
        notes: transaction.notes ?? "",
        date: transaction.date,
        isCleared: transaction.isCleared,
      });
    }
  }, [transaction, form]);

  const parentCategories = categories?.filter((c) => !c.parentId) ?? [];

  function onSubmit(data: EditIncomeExpenseValues) {
    updateTransaction.mutate(
      {
        id: transaction.id,
        data: {
          accountId: data.accountId,
          categoryId: data.categoryId,
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
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="edit-tx-category">Category</FieldLabel>
              <NativeSelect
                id="edit-tx-category"
                className="w-full"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
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

        {/* Description */}
        <Field>
          <FieldLabel htmlFor="edit-tx-description">Description</FieldLabel>
          <Input
            id="edit-tx-description"
            {...form.register("description")}
            autoComplete="off"
            className="text-xs"
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
          />
        </Field>
      </FieldGroup>

      {/* Actions */}
      <div className="flex justify-between gap-2 md:hidden">
        {onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        )}
        <Button
          type="submit"
          disabled={updateTransaction.isPending}
          className="flex-1"
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
          >
            Delete
          </Button>
        )}
        <Button type="submit" disabled={updateTransaction.isPending}>
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
          />
        </Field>
      </FieldGroup>

      {/* Actions */}
      <div className="flex justify-between gap-2 md:hidden">
        {onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        )}
        <Button
          type="submit"
          disabled={updateTransaction.isPending}
          className="flex-1"
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
          >
            Delete
          </Button>
        )}
        <Button type="submit" disabled={updateTransaction.isPending}>
          {updateTransaction.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
