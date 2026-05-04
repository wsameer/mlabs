import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useAccounts } from "@/features/accounts/api/use-accounts";
import { useCreateTransaction } from "../../api/use-transactions";
import { useUiActions } from "@/hooks/use-ui-store";
import { useTimezone } from "@/hooks/use-timezone";
import { todayString } from "@/lib/timezone";

import { cn } from "@workspace/ui/lib/utils";
import { FieldGroup } from "@workspace/ui/components/field";

import { TransferFormSchema, type TransferFormValues } from "./schemas";
import { AccountSelect } from "./fields/AccountSelect";
import { AmountField } from "./fields/AmountField";
import { DatePickerField } from "./fields/DatePickerField";
import { DescriptionField } from "./fields/DescriptionField";
import { NotesField } from "./fields/NotesField";
import { SubmitRow } from "./fields/SubmitRow";

interface TransferFormProps {
  className?: string;
}

export function TransferForm({ className }: TransferFormProps) {
  const createTransaction = useCreateTransaction();
  const { setOpenCreateTransaction } = useUiActions();
  const tz = useTimezone();
  const { data: accounts } = useAccounts({ isActive: true });

  const today = todayString(tz);

  const form = useForm<TransferFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        <AccountSelect
          control={form.control}
          name="fromAccountId"
          id="tx-from-account"
          label="From account"
          accounts={accounts}
          testId="tx-create-from-account"
        />

        <AccountSelect
          control={form.control}
          name="toAccountId"
          id="tx-to-account"
          label="To account"
          accounts={accounts}
          testId="tx-create-to-account"
        />

        <div className="grid grid-cols-2 gap-3">
          <AmountField
            control={form.control}
            name="amount"
            id="tx-transfer-amount"
            testId="tx-create-amount"
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
                testId="tx-create-date"
              />
            )}
          />
        </div>

        <DescriptionField
          register={form.register}
          name="description"
          id="tx-transfer-description"
          placeholder="e.g. Move savings"
          testId="tx-create-description"
        />

        <NotesField
          register={form.register}
          name="notes"
          id="tx-transfer-notes"
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
