import type { FieldPath, FieldValues, UseFormRegister } from "react-hook-form";

import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Textarea } from "@workspace/ui/components/textarea";

interface NotesFieldProps<TFieldValues extends FieldValues> {
  register: UseFormRegister<TFieldValues>;
  name: FieldPath<TFieldValues>;
  id: string;
  testId?: string;
}

export function NotesField<TFieldValues extends FieldValues>({
  register,
  name,
  id,
  testId,
}: NotesFieldProps<TFieldValues>) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>Notes</FieldLabel>
      <Textarea
        id={id}
        {...register(name)}
        placeholder="Optional notes..."
        rows={2}
        className="text-xs"
        data-testid={testId}
      />
    </Field>
  );
}
