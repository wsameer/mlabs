import { useEffect, useMemo, useState } from "react";
import { Controller, useWatch, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  WORKSPACE_TYPES,
  WorkspaceBasicsSchema,
  WorkspaceNameSchema,
  type WorkspaceBasics,
} from "@workspace/types";
import { Input } from "@workspace/ui/components/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";

import { useWorkspaceNameAvailability } from "../../api/use-workspace-name-availability";
import type { OnboardingStepComponentProps } from "../../types";

const WORKSPACE_TYPE_LABELS: Record<WorkspaceBasics["type"], string> = {
  PERSONAL: "Personal",
  BUSINESS: "Business",
  SHARED: "Shared",
};

export function WorkspaceBasicsStep({
  formState,
  updateWorkspaceBasics,
  setStepCompletion,
}: OnboardingStepComponentProps) {
  const [debouncedName, setDebouncedName] = useState(
    formState.workspaceBasics.name
  );

  const form = useForm<WorkspaceBasics>({
    resolver: zodResolver(WorkspaceBasicsSchema),
    mode: "onChange",
    defaultValues: formState.workspaceBasics,
  });

  const currentValues = useWatch({
    control: form.control,
  });
  const trimmedName = currentValues.name?.trim() ?? "";
  const nameFormatResult = useMemo(
    () => WorkspaceNameSchema.safeParse(trimmedName),
    [trimmedName]
  );
  const isNamePendingCheck =
    nameFormatResult.success && trimmedName !== debouncedName;
  const shouldCheckAvailability =
    nameFormatResult.success && debouncedName !== "";
  const nameAvailability = useWorkspaceNameAvailability(
    debouncedName,
    shouldCheckAvailability
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedName(trimmedName);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [trimmedName]);

  useEffect(() => {
    updateWorkspaceBasics({
      name: trimmedName,
      type: currentValues.type ?? formState.workspaceBasics.type,
    });
  }, [
    currentValues.type,
    formState.workspaceBasics.type,
    trimmedName,
    updateWorkspaceBasics,
  ]);

  const isNameAvailable =
    !shouldCheckAvailability || nameAvailability.data?.available === true;

  const hasAvailabilityError =
    shouldCheckAvailability && nameAvailability.data?.available === false;
  const hasRequestError = shouldCheckAvailability && nameAvailability.isError;
  const isStepValid =
    form.formState.isValid &&
    shouldCheckAvailability &&
    !isNamePendingCheck &&
    isNameAvailable &&
    !hasRequestError;

  useEffect(() => {
    setStepCompletion(1, isStepValid);
  }, [isStepValid, setStepCompletion]);

  return (
    <div className="rounded-md border p-4 text-left">
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || hasAvailabilityError}>
              <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
              <Input
                {...field}
                id="workspace-name"
                autoComplete="off"
                placeholder="myworkspace"
                aria-invalid={fieldState.invalid || hasAvailabilityError}
                autoFocus
              />
              <FieldDescription>
                Use letters and numbers only, with no spaces or symbols.
              </FieldDescription>
              {hasRequestError ? (
                <FieldError>
                  We could not verify this workspace name right now.
                </FieldError>
              ) : null}
              {hasAvailabilityError && (
                <FieldError>This workspace name is already taken.</FieldError>
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="type"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="workspace-type">Workspace type</FieldLabel>
              <NativeSelect
                id="workspace-type"
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                onChange={field.onChange}
                aria-invalid={fieldState.invalid}
                className="w-full"
              >
                {WORKSPACE_TYPES.map((type) => (
                  <NativeSelectOption key={type} value={type}>
                    {WORKSPACE_TYPE_LABELS[type]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
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
