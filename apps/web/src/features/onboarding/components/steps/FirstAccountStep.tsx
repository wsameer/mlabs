import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  FirstAccountSchema,
  ONBOARDING_ACCOUNT_GROUPS,
  hasFirstAccountData,
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

  const nextFirstAccount = useMemo(
    () => ({
      name: currentValues.name?.trim() ?? "",
      group: currentValues.group ?? formState.firstAccount.group,
      balance: currentValues.balance?.trim() ?? "",
    }),
    [
      currentValues.balance,
      currentValues.group,
      currentValues.name,
      formState.firstAccount.group,
    ]
  );

  const isOptionalStepEmpty = !hasFirstAccountData(nextFirstAccount);
  const validationResult = useMemo(
    () =>
      isOptionalStepEmpty
        ? { success: true as const, error: undefined }
        : FirstAccountSchema.safeParse(nextFirstAccount),
    [isOptionalStepEmpty, nextFirstAccount]
  );

  const fieldErrors = validationResult.success
    ? {}
    : Object.fromEntries(
        validationResult.error.issues.map((issue) => [
          String(issue.path[0]),
          issue.message,
        ])
      );

  useEffect(() => {
    setStepCompletion(step, validationResult.success);
  }, [setStepCompletion, step, validationResult.success]);

  return (
    <div className="rounded-md border p-4 text-left">
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field }) => (
            <Field data-invalid={Boolean(fieldErrors.name)}>
              <FieldLabel htmlFor="first-account-name">Account name</FieldLabel>
              <Input
                {...field}
                id="first-account-name"
                autoComplete="off"
                placeholder="Main chequing"
                disabled={isSubmitting}
              />
              <FieldDescription>
                Optional. Leave this blank if you want to finish onboarding
                faster and add an account from the dashboard instead.
              </FieldDescription>
              {fieldErrors.name ? (
                <FieldError>{fieldErrors.name}</FieldError>
              ) : null}
            </Field>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            name="group"
            control={form.control}
            render={({ field }) => (
              <Field data-invalid={Boolean(fieldErrors.group)}>
                <FieldLabel htmlFor="first-account-group">
                  Account type
                </FieldLabel>
                <NativeSelect
                  id="first-account-group"
                  name={field.name}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  aria-invalid={Boolean(fieldErrors.group)}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {ONBOARDING_ACCOUNT_GROUPS.map((group) => (
                    <NativeSelectOption key={group} value={group}>
                      {ACCOUNT_GROUP_LABELS[group]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {fieldErrors.group ? (
                  <FieldError>{fieldErrors.group}</FieldError>
                ) : null}
              </Field>
            )}
          />

          <Controller
            name="balance"
            control={form.control}
            render={({ field }) => (
              <Field data-invalid={Boolean(fieldErrors.balance)}>
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
                  Optional unless you start filling this account. Use a negative
                  amount for liabilities like credit cards.
                </FieldDescription>
                {fieldErrors.balance ? (
                  <FieldError>{fieldErrors.balance}</FieldError>
                ) : null}
              </Field>
            )}
          />
        </div>
      </FieldGroup>
    </div>
  );
}
