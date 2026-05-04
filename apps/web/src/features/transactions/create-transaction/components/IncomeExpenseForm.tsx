import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useAccounts } from "@/features/accounts/api/use-accounts";
import { useCategories } from "@/features/categories/api/use-categories";
import { useCreateTransaction } from "../../api/use-transactions";
import { useUiActions } from "@/hooks/use-ui-store";
import { useTimezone } from "@/hooks/use-timezone";
import { todayString } from "@/lib/timezone";

import { cn } from "@workspace/ui/lib/utils";
import { FieldGroup } from "@workspace/ui/components/field";

import {
  IncomeExpenseFormSchema,
  type IncomeExpenseFormValues,
} from "./schemas";
import { AccountSelect } from "./fields/AccountSelect";
import { AmountField } from "./fields/AmountField";
import { DatePickerField } from "./fields/DatePickerField";
import { DescriptionField } from "./fields/DescriptionField";
import { NotesField } from "./fields/NotesField";
import { SubmitRow } from "./fields/SubmitRow";
import { CategoryPicker } from "./category-picker";

interface IncomeExpenseFormProps {
  type: "INCOME" | "EXPENSE";
  className?: string;
}

export function IncomeExpenseForm({ type, className }: IncomeExpenseFormProps) {
  const createTransaction = useCreateTransaction();
  const { setOpenCreateTransaction } = useUiActions();
  const tz = useTimezone();
  const { data: accounts } = useAccounts({ isActive: true });
  const { data: categories } = useCategories({ type, isActive: true });

  const today = todayString(tz);

  const form = useForm<IncomeExpenseFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const subcategoryId = useWatch({
    control: form.control,
    name: "subcategoryId",
  });

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
        <AccountSelect
          control={form.control}
          name="accountId"
          id="tx-account"
          label="Account"
          accounts={accounts}
          testId="tx-create-account"
        />

        <div className="grid grid-cols-2 gap-3">
          <AmountField
            control={form.control}
            name="amount"
            id="tx-amount"
            testId="tx-create-amount"
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
                testId="tx-create-date"
              />
            )}
          />
        </div>

        <Controller
          name="categoryId"
          control={form.control}
          render={({ field, fieldState }) => {
            const value = field.value
              ? { categoryId: field.value, subcategoryId }
              : null;
            return (
              <CategoryPicker
                id="tx-category"
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
                testId="tx-create-category"
              />
            );
          }}
        />

        <DescriptionField
          register={form.register}
          name="description"
          id="tx-description"
          testId="tx-create-description"
        />

        <NotesField
          register={form.register}
          name="notes"
          id="tx-notes"
          testId="tx-create-notes"
        />
      </FieldGroup>

      <SubmitRow
        isPending={createTransaction.isPending}
        testId="tx-create-submit"
      />
    </form>
  );
}
