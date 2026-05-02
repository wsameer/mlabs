import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { DollarSignIcon } from "lucide-react";

import {
  Field,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group";

interface AmountFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  id: string;
  label?: string;
  testId?: string;
}

export function AmountField<TFieldValues extends FieldValues>({
  control,
  name,
  id,
  label = "Amount",
  testId,
}: AmountFieldProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <InputGroup>
            <InputGroupInput
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              id={id}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="text-xs"
              data-testid={testId}
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
  );
}
