import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DATE_FORMATS,
  SUPPORTED_CURRENCIES,
  WEEK_STARTS,
  RegionalPreferencesSchema,
  type RegionalPreferences,
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

const DATE_FORMAT_LABELS: Record<RegionalPreferences["dateFormat"], string> = {
  "D MMM, YYYY": "20 May, 2026",
  "DD/MM/YYYY": "20/05/2026",
  "MM/DD/YYYY": "05/20/2026",
  "YYYY-MM-DD": "2026-05-20",
};

const WEEK_START_LABELS: Record<RegionalPreferences["weekStart"], string> = {
  SUNDAY: "Sunday",
  MONDAY: "Monday",
};

const CURRENCY_LABELS: Record<RegionalPreferences["currency"], string> = {
  CAD: "CAD - Canadian Dollar",
  USD: "USD - US Dollar",
  EUR: "EUR - Euro",
  GBP: "GBP - British Pound",
};

export function RegionalPreferencesStep({
  step,
  formState,
  updateRegionalPreferences,
  setStepCompletion,
}: OnboardingStepComponentProps) {
  const form = useForm<RegionalPreferences>({
    resolver: zodResolver(RegionalPreferencesSchema),
    mode: "onChange",
    defaultValues: formState.regionalPreferences,
  });

  const currentValues = useWatch({
    control: form.control,
  });

  useEffect(() => {
    updateRegionalPreferences({
      currency:
        currentValues.currency ?? formState.regionalPreferences.currency,
      dateFormat:
        currentValues.dateFormat ?? formState.regionalPreferences.dateFormat,
      weekStart:
        currentValues.weekStart ?? formState.regionalPreferences.weekStart,
      timezone:
        currentValues.timezone?.trim() ||
        formState.regionalPreferences.timezone,
    });
  }, [
    currentValues.currency,
    currentValues.dateFormat,
    currentValues.timezone,
    currentValues.weekStart,
    formState.regionalPreferences.currency,
    formState.regionalPreferences.dateFormat,
    formState.regionalPreferences.timezone,
    formState.regionalPreferences.weekStart,
    updateRegionalPreferences,
  ]);

  useEffect(() => {
    setStepCompletion(step, form.formState.isValid);
  }, [form.formState.isValid, setStepCompletion, step]);

  return (
    <div className="rounded-md border p-4 text-left">
      <FieldGroup>
        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            name="currency"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="workspace-currency">Currency</FieldLabel>
                <NativeSelect
                  id="workspace-currency"
                  name={field.name}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  aria-invalid={fieldState.invalid}
                  className="w-full"
                >
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <NativeSelectOption key={currency} value={currency}>
                      {CURRENCY_LABELS[currency]}
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
            name="weekStart"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="workspace-week-start">
                  Week starts on
                </FieldLabel>
                <NativeSelect
                  id="workspace-week-start"
                  name={field.name}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  aria-invalid={fieldState.invalid}
                  className="w-full"
                >
                  {WEEK_STARTS.map((weekStart) => (
                    <NativeSelectOption key={weekStart} value={weekStart}>
                      {WEEK_START_LABELS[weekStart]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
        </div>

        <Controller
          name="dateFormat"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="workspace-date-format">
                Date format
              </FieldLabel>
              <NativeSelect
                id="workspace-date-format"
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                onChange={field.onChange}
                aria-invalid={fieldState.invalid}
                className="w-full"
              >
                {DATE_FORMATS.map((dateFormat) => (
                  <NativeSelectOption key={dateFormat} value={dateFormat}>
                    {DATE_FORMAT_LABELS[dateFormat]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldDescription>
                This controls how dates appear across the workspace.
              </FieldDescription>
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Controller
          name="timezone"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="workspace-timezone">Timezone</FieldLabel>
              <Input
                {...field}
                id="workspace-timezone"
                readOnly
                aria-readonly="true"
                className="bg-muted"
              />
              <FieldDescription>
                Detected from this device for now. We can make this editable
                later if needed.
              </FieldDescription>
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />
      </FieldGroup>
    </div>
  );
}
