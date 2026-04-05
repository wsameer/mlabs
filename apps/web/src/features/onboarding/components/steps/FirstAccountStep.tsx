import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FirstAccountSchema,
  ONBOARDING_ACCOUNT_GROUPS,
  type FirstAccount,
} from "@workspace/types";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";

import type { OnboardingStepComponentProps } from "../../types";

const ACCOUNT_GROUP_LABELS: Record<FirstAccount["group"], string> = {
  checking: "Checking",
  savings: "Savings",
  cash: "Cash",
  credit_card: "Credit card",
  investment: "Investment",
  other: "Other",
};

export function FirstAccountStep({
  step,
  formState,
  isSubmitting,
  updateFirstAccount,
  setStepCompletion,
}: OnboardingStepComponentProps) {
  const form = useForm<FirstAccount>({
    resolver: zodResolver(FirstAccountSchema),
    mode: "onChange",
    defaultValues: formState.firstAccount,
  });

  const currentValues = useWatch({
    control: form.control,
  });

  useEffect(() => {
    updateFirstAccount({
      name: currentValues.name?.trim() ?? "",
      group: currentValues.group ?? formState.firstAccount.group,
      balance: currentValues.balance?.trim() ?? "",
    });
  }, [
    currentValues.balance,
    currentValues.group,
    currentValues.name,
    formState.firstAccount.group,
    updateFirstAccount,
  ]);

  useEffect(() => {
    setStepCompletion(step, form.formState.isValid);
  }, [form.formState.isValid, setStepCompletion, step]);

  return (
    <div className="rounded-md border p-4 text-left">
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="first-account-name">Account name</FieldLabel>
              <Input
                {...field}
                id="first-account-name"
                autoComplete="off"
                placeholder="Main chequing"
                disabled={isSubmitting}
              />
              <FieldDescription>
                This starter account helps us finish the workspace setup.
              </FieldDescription>
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            name="group"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="first-account-group">
                  Account type
                </FieldLabel>
                <NativeSelect
                  id="first-account-group"
                  name={field.name}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  aria-invalid={fieldState.invalid}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {ONBOARDING_ACCOUNT_GROUPS.map((group) => (
                    <NativeSelectOption key={group} value={group}>
                      {ACCOUNT_GROUP_LABELS[group]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />

          <Controller
            name="balance"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="first-account-balance">
                  Opening balance
                </FieldLabel>
                <Input
                  {...field}
                  id="first-account-balance"
                  inputMode="decimal"
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
                <FieldDescription>
                  Use a negative amount for liabilities like credit cards.
                </FieldDescription>
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
        </div>
      </FieldGroup>
    </div>
  );
}
