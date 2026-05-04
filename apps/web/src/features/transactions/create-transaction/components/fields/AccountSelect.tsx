import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import type { Account } from "@workspace/types";
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";

interface AccountSelectProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  id: string;
  label: string;
  accounts: Account[] | undefined;
  testId?: string;
}

export function AccountSelect<TFieldValues extends FieldValues>({
  control,
  name,
  id,
  label,
  accounts,
  testId,
}: AccountSelectProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <NativeSelect
            id={id}
            className="w-full"
            value={field.value ?? ""}
            onChange={(e) => field.onChange(e.target.value)}
            data-testid={testId}
          >
            <NativeSelectOption value="">Select account...</NativeSelectOption>
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
  );
}
