import {
  CalendarDaysIcon,
  CoinsIcon,
  NotebookTextIcon,
  ShapesIcon,
  SmilePlusIcon,
} from "lucide-react";

import {
  DATE_FORMATS,
  SUPPORTED_CURRENCIES,
  WEEK_STARTS,
  WORKSPACE_TYPES,
} from "@workspace/types";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";

import {
  CURRENCY_LABELS,
  DATE_FORMAT_LABELS,
  WEEK_START_LABELS,
  WORKSPACE_TYPE_LABELS,
  type SettingsFormValues,
} from "./settings-shared";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@workspace/ui/components/input-group";

type SettingsPreferencesSectionProps = {
  draft: SettingsFormValues;
  isBusy: boolean;
  isNotesDebouncing: boolean;
  isNotesSaving: boolean;
  onIconChange: (value: string) => void | Promise<void>;
  onTypeChange: (value: SettingsFormValues["type"]) => void | Promise<void>;
  onCurrencyChange: (
    value: SettingsFormValues["currency"]
  ) => void | Promise<void>;
  onWeekStartChange: (
    value: SettingsFormValues["weekStart"]
  ) => void | Promise<void>;
  onDateFormatChange: (
    value: SettingsFormValues["dateFormat"]
  ) => void | Promise<void>;
  onNotesChange: (value: string) => void;
  onNotesSave: () => void | Promise<void>;
};

export function SettingsPreferencesSection({
  draft,
  isBusy,
  isNotesDebouncing,
  isNotesSaving,
  onIconChange,
  onTypeChange,
  onCurrencyChange,
  onWeekStartChange,
  onDateFormatChange,
  onNotesChange,
  onNotesSave,
}: SettingsPreferencesSectionProps) {
  return (
    <section className="space-y-2">
      <p className="px-1 text-[0.7rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        Preferences
      </p>
      <Card className="p-0">
        <CardContent className="p-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="workspace-icon">Workspace icon</FieldLabel>
              <div className="relative">
                <SmilePlusIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="workspace-icon"
                  value={draft.icon}
                  onChange={(event) =>
                    void onIconChange(event.target.value.slice(0, 10))
                  }
                  placeholder="e.g. 💼"
                  maxLength={10}
                  className="pl-8"
                  disabled={isBusy}
                />
              </div>
              <FieldDescription>
                Use a short emoji or symbol for quick recognition.
              </FieldDescription>
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="workspace-type">Workspace type</FieldLabel>
                <div className="relative">
                  <ShapesIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <NativeSelect
                    id="workspace-type"
                    value={draft.type}
                    onChange={(event) =>
                      void onTypeChange(
                        event.target.value as SettingsFormValues["type"]
                      )
                    }
                    className="w-full pl-8"
                    disabled={isBusy}
                  >
                    {WORKSPACE_TYPES.map((type) => (
                      <NativeSelectOption key={type} value={type}>
                        {WORKSPACE_TYPE_LABELS[type]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="workspace-currency">Currency</FieldLabel>
                <div className="relative">
                  <CoinsIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <NativeSelect
                    id="workspace-currency"
                    value={draft.currency}
                    onChange={(event) =>
                      void onCurrencyChange(
                        event.target.value as SettingsFormValues["currency"]
                      )
                    }
                    className="w-full pl-8"
                    disabled={isBusy}
                  >
                    {SUPPORTED_CURRENCIES.map((currency) => (
                      <NativeSelectOption key={currency} value={currency}>
                        {CURRENCY_LABELS[currency]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="workspace-week-start">
                  Week starts on
                </FieldLabel>
                <div className="relative">
                  <CalendarDaysIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <NativeSelect
                    id="workspace-week-start"
                    value={draft.weekStart}
                    onChange={(event) =>
                      void onWeekStartChange(
                        event.target.value as SettingsFormValues["weekStart"]
                      )
                    }
                    className="w-full pl-8"
                    disabled={isBusy}
                  >
                    {WEEK_STARTS.map((weekStart) => (
                      <NativeSelectOption key={weekStart} value={weekStart}>
                        {WEEK_START_LABELS[weekStart]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="workspace-date-format">
                  Date format
                </FieldLabel>
                <div className="relative">
                  <CalendarDaysIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <NativeSelect
                    id="workspace-date-format"
                    value={draft.dateFormat}
                    onChange={(event) =>
                      void onDateFormatChange(
                        event.target.value as SettingsFormValues["dateFormat"]
                      )
                    }
                    className="w-full pl-8"
                    disabled={isBusy}
                  >
                    {DATE_FORMATS.map((dateFormat) => (
                      <NativeSelectOption key={dateFormat} value={dateFormat}>
                        {DATE_FORMAT_LABELS[dateFormat]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="workspace-notes">Notes</FieldLabel>
              <InputGroup className="relative">
                <NotebookTextIcon className="pointer-events-none absolute top-3 left-2.5 size-3.5 text-muted-foreground" />
                <InputGroupTextarea
                  id="workspace-notes"
                  value={draft.notes}
                  onChange={(event) => onNotesChange(event.target.value)}
                  placeholder="Anything useful to remember about this workspace"
                  className="min-h-10 pl-8"
                  maxLength={160}
                />
                <InputGroupAddon align="block-end">
                  <InputGroupText>
                    {draft.notes.length}/160
                    {isNotesDebouncing ? " unsaved" : ""}
                  </InputGroupText>
                  <InputGroupButton
                    variant="default"
                    size="sm"
                    className="ml-auto"
                    disabled={!isNotesDebouncing || isNotesSaving || isBusy}
                    onClick={() => void onNotesSave()}
                  >
                    {isNotesSaving ? "Saving" : "Save"}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription>
                Private notes for this workspace only.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </section>
  );
}
