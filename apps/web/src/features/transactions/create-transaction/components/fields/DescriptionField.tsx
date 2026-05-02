import type {
  FieldPath,
  FieldValues,
  UseFormRegister,
} from "react-hook-form";

import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";

interface DescriptionFieldProps<TFieldValues extends FieldValues> {
  register: UseFormRegister<TFieldValues>;
  name: FieldPath<TFieldValues>;
  id: string;
  placeholder?: string;
  testId?: string;
}

export function DescriptionField<TFieldValues extends FieldValues>({
  register,
  name,
  id,
  placeholder = "e.g. Grocery shopping",
  testId,
}: DescriptionFieldProps<TFieldValues>) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>Description</FieldLabel>
      <Input
        id={id}
        {...register(name)}
        placeholder={placeholder}
        autoComplete="off"
        className="text-xs"
        data-testid={testId}
      />
    </Field>
  );
}
