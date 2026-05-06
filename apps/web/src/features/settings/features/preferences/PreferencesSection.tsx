import {
  CalendarDaysIcon,
  CoinsIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react";

import {
  DATE_FORMATS,
  SUPPORTED_CURRENCIES,
  WEEK_STARTS,
} from "@workspace/types";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";
import { cn } from "@workspace/ui/lib/utils";

import { useTheme } from "@/components/ThemeProvider";
import {
  CURRENCY_LABELS,
  DATE_FORMAT_LABELS,
  WEEK_START_LABELS,
  type SettingsFormValues,
} from "../../components/settings-shared";
import type { SettingsSectionProps } from "../../types";

const SECTION_HEADING_CLASS =
  "px-4 text-xs font-normal text-muted-foreground uppercase md:px-1 md:text-[0.7rem] md:font-semibold md:tracking-[0.18em]";

export function PreferencesSection({ settings }: SettingsSectionProps) {
  const { theme, setTheme } = useTheme();

  if (!settings.draft) return null;

  return (
    <div className="flex flex-col gap-5">
      <section className="space-y-1.5">
        <p className={SECTION_HEADING_CLASS}>Appearance</p>
        <Card className="rounded-xl p-0 md:rounded-lg">
          <CardContent className="p-4">
            <Field>
              <FieldLabel htmlFor="appearance-theme">Theme</FieldLabel>
              <div
                id="appearance-theme"
                role="radiogroup"
                aria-label="Theme"
                className="inline-flex w-fit rounded-full bg-muted p-1"
              >
                {(
                  [
                    { value: "light", label: "Light", Icon: SunIcon },
                    { value: "dark", label: "Dark", Icon: MoonIcon },
                  ] as const
                ).map(({ value, label, Icon }) => {
                  const isActive = theme === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => setTheme(value)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="size-3.5" />
                      {label}
                    </button>
                  );
                })}
              </div>
              <FieldDescription>
                Press{" "}
                <kbd className="rounded border bg-muted px-1 text-[0.7rem]">
                  D
                </kbd>{" "}
                anywhere to toggle.
              </FieldDescription>
            </Field>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-1.5">
        <p className={SECTION_HEADING_CLASS}>Regional</p>
        <Card className="rounded-xl p-0 md:rounded-lg">
          <CardContent className="p-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="workspace-currency">Currency</FieldLabel>
                <div className="relative">
                  <CoinsIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <NativeSelect
                    id="workspace-currency"
                    value={settings.draft.currency}
                    onChange={(event) =>
                      void settings.updateImmediateField(
                        "currency",
                        event.target.value as SettingsFormValues["currency"]
                      )
                    }
                    className="w-full pl-8"
                    disabled={settings.isBusy}
                  >
                    {SUPPORTED_CURRENCIES.map((currency) => (
                      <NativeSelectOption key={currency} value={currency}>
                        {CURRENCY_LABELS[currency]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="workspace-week-start">
                  Week starts on
                </FieldLabel>
                <div className="relative">
                  <CalendarDaysIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <NativeSelect
                    id="workspace-week-start"
                    value={settings.draft.weekStart}
                    onChange={(event) =>
                      void settings.updateImmediateField(
                        "weekStart",
                        event.target.value as SettingsFormValues["weekStart"]
                      )
                    }
                    className="w-full pl-8"
                    disabled={settings.isBusy}
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
                    value={settings.draft.dateFormat}
                    onChange={(event) =>
                      void settings.updateImmediateField(
                        "dateFormat",
                        event.target.value as SettingsFormValues["dateFormat"]
                      )
                    }
                    className="w-full pl-8"
                    disabled={settings.isBusy}
                  >
                    {DATE_FORMATS.map((dateFormat) => (
                      <NativeSelectOption key={dateFormat} value={dateFormat}>
                        {DATE_FORMAT_LABELS[dateFormat]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
