import { useState } from "react";
import { Building2Icon, ChevronRightIcon, WalletCardsIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";
import type {
  AccountGroup,
  CreateOnboardingProfile,
  DateFormat,
  ProfileType,
  WeekStart,
} from "@workspace/types";

import { DASHBOARD_ROUTE } from "@/constants";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/stores";

type OnboardingPageProps = {
  step: OnboardingStep;
  onStepChange: (step: OnboardingStep) => void;
};

type OnboardingStep = 1 | 2 | 3;

type OnboardingFormState = CreateOnboardingProfile & {
  firstAccountEnabled: boolean;
};

const profileTypes: Array<{ label: string; value: ProfileType }> = [
  { label: "Personal", value: "PERSONAL" },
  { label: "Business", value: "BUSINESS" },
  { label: "Shared", value: "SHARED" },
];

const dateFormats: Array<{ label: string; value: DateFormat }> = [
  { label: "12 Aug, 2025", value: "D MMM, YYYY" },
  { label: "12/08/2025", value: "DD/MM/YYYY" },
  { label: "08/12/2025", value: "MM/DD/YYYY" },
  { label: "2025-08-12", value: "YYYY-MM-DD" },
];

const weekStarts: Array<{ label: string; value: WeekStart }> = [
  { label: "Monday", value: "MONDAY" },
  { label: "Sunday", value: "SUNDAY" },
];

const accountGroups: Array<{ label: string; value: AccountGroup }> = [
  { label: "Checking", value: "checking" },
  { label: "Savings", value: "savings" },
  { label: "Cash", value: "cash" },
  { label: "Credit card", value: "credit_card" },
  { label: "Investment", value: "investment" },
  { label: "Loan", value: "loan" },
  { label: "Mortgage", value: "mortgage" },
  { label: "Asset", value: "asset" },
  { label: "Other", value: "other" },
];

const currencies = ["CAD", "USD", "EUR", "GBP"];

const stepTitles = {
  1: "Set up your workspace",
  2: "Regional preferences",
  3: "Add your first account",
} satisfies Record<OnboardingStep, string>;

const stepDescriptions = {
  1: "Give this workspace a name and quick identity.",
  2: "Choose the defaults that shape how data is displayed.",
  3: "This part is optional. You can skip it and add accounts later.",
} satisfies Record<OnboardingStep, string>;

function getBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Toronto";
}

export function OnboardingPage({
  step,
  onStepChange,
}: OnboardingPageProps) {
  const navigate = useNavigate();
  const fetchAppData = useAppStore((state) => state.fetchAppData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<OnboardingFormState>({
    name: "",
    icon: "🏠",
    type: "PERSONAL",
    currency: "CAD",
    dateFormat: "D MMM, YYYY",
    weekStart: "MONDAY",
    timezone: getBrowserTimezone(),
    firstAccountEnabled: false,
    firstAccount: {
      name: "",
      group: "checking",
      balance: "0",
    },
  });

  const canContinueStepOne = form.name.trim().length > 0;
  const canContinueStepTwo = form.timezone.trim().length > 0;
  const canSubmit =
    !form.firstAccountEnabled || !!form.firstAccount?.name.trim().length;

  function updateForm<K extends keyof OnboardingFormState>(
    key: K,
    value: OnboardingFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateFirstAccount<K extends keyof NonNullable<OnboardingFormState["firstAccount"]>>(
    key: K,
    value: NonNullable<OnboardingFormState["firstAccount"]>[K]
  ) {
    setForm((current) => ({
      ...current,
      firstAccount: {
        name: "",
        group: "checking",
        balance: "0",
        ...current.firstAccount,
        [key]: value,
      },
    }));
  }

  function goToNextStep() {
    if (step < 3) {
      onStepChange((step + 1) as OnboardingStep);
    }
  }

  function goToPreviousStep() {
    if (step > 1) {
      onStepChange((step - 1) as OnboardingStep);
    }
  }

  async function submitProfile(skipAccount = false) {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const payload: CreateOnboardingProfile = {
        name: form.name.trim(),
        icon: form.icon?.trim() || undefined,
        type: form.type,
        currency: form.currency,
        dateFormat: form.dateFormat,
        weekStart: form.weekStart,
        timezone: form.timezone.trim(),
        firstAccount:
          skipAccount || !form.firstAccountEnabled
            ? undefined
            : {
                name: form.firstAccount?.name.trim() || "",
                group: form.firstAccount?.group || "checking",
                balance: form.firstAccount?.balance || "0",
              },
      };

      await apiClient("/profiles", {
        method: "POST",
        body: payload,
        includeProfileId: false,
      });

      await fetchAppData();
      await navigate({ to: DASHBOARD_ROUTE, replace: true });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl items-center px-4 py-8">
      <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-none bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_48%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(15,23,42,0.92))] text-white ring-0">
          <CardHeader>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
              <Building2Icon className="size-6" />
            </div>
            <CardTitle className="text-2xl font-semibold">
              Welcome to mLabs
            </CardTitle>
            <CardDescription className="max-w-sm text-white/70">
              A short setup flow gets your workspace ready before the rest of
              the app loads.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {([1, 2, 3] as const).map((stepNumber) => {
              const isActive = stepNumber === step;
              const isComplete = stepNumber < step;

              return (
                <div
                  key={stepNumber}
                  className={`rounded-2xl border px-4 py-3 transition ${
                    isActive
                      ? "border-white/30 bg-white/12"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-8 items-center justify-center rounded-full text-sm font-medium ${
                        isComplete || isActive
                          ? "bg-white text-slate-900"
                          : "bg-white/10 text-white/70"
                      }`}
                    >
                      {stepNumber}
                    </div>
                    <div>
                      <p className="font-medium">{stepTitles[stepNumber]}</p>
                      <p className="text-sm text-white/65">
                        {stepDescriptions[stepNumber]}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl ring-1 ring-foreground/8">
          <CardHeader>
            <CardTitle>{stepTitles[step]}</CardTitle>
            <CardDescription>{stepDescriptions[step]}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Workspace name</label>
                  <Input
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    placeholder="My finances"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Workspace type</label>
                    <NativeSelect
                      value={form.type}
                      onChange={(event) =>
                        updateForm("type", event.target.value as ProfileType)
                      }
                      className="w-full"
                    >
                      {profileTypes.map((option) => (
                        <NativeSelectOption
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Icon</label>
                    <Input
                      value={form.icon}
                      onChange={(event) =>
                        updateForm("icon", event.target.value.slice(0, 2))
                      }
                      placeholder="🏠"
                    />
                  </div>
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Currency</label>
                    <NativeSelect
                      value={form.currency}
                      onChange={(event) =>
                        updateForm("currency", event.target.value)
                      }
                      className="w-full"
                    >
                      {currencies.map((currency) => (
                        <NativeSelectOption key={currency} value={currency}>
                          {currency}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date format</label>
                    <NativeSelect
                      value={form.dateFormat}
                      onChange={(event) =>
                        updateForm(
                          "dateFormat",
                          event.target.value as DateFormat
                        )
                      }
                      className="w-full"
                    >
                      {dateFormats.map((format) => (
                        <NativeSelectOption
                          key={format.value}
                          value={format.value}
                        >
                          {format.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Week starts on</label>
                    <NativeSelect
                      value={form.weekStart}
                      onChange={(event) =>
                        updateForm("weekStart", event.target.value as WeekStart)
                      }
                      className="w-full"
                    >
                      {weekStarts.map((option) => (
                        <NativeSelectOption
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timezone</label>
                    <Input
                      value={form.timezone}
                      onChange={(event) =>
                        updateForm("timezone", event.target.value)
                      }
                      placeholder="America/Toronto"
                    />
                  </div>
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <div className="rounded-2xl border border-dashed p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <WalletCardsIcon className="size-4 text-muted-foreground" />
                        <p className="font-medium">Create an account now</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Add a starter account so your dashboard has somewhere to
                        begin.
                      </p>
                    </div>

                    <Button
                      variant={form.firstAccountEnabled ? "secondary" : "outline"}
                      onClick={() =>
                        updateForm(
                          "firstAccountEnabled",
                          !form.firstAccountEnabled
                        )
                      }
                    >
                      {form.firstAccountEnabled ? "Enabled" : "Add account"}
                    </Button>
                  </div>
                </div>

                {form.firstAccountEnabled ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium">Account name</label>
                      <Input
                        value={form.firstAccount?.name ?? ""}
                        onChange={(event) =>
                          updateFirstAccount("name", event.target.value)
                        }
                        placeholder="Main checking"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Account type</label>
                      <NativeSelect
                        value={form.firstAccount?.group ?? "checking"}
                        onChange={(event) =>
                          updateFirstAccount(
                            "group",
                            event.target.value as AccountGroup
                          )
                        }
                        className="w-full"
                      >
                        {accountGroups.map((group) => (
                          <NativeSelectOption
                            key={group.value}
                            value={group.value}
                          >
                            {group.label}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Opening balance
                      </label>
                      <Input
                        value={form.firstAccount?.balance ?? "0"}
                        onChange={(event) =>
                          updateFirstAccount("balance", event.target.value)
                        }
                        inputMode="decimal"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </CardContent>

          <CardFooter className="justify-between border-t pt-4">
            <div className="flex gap-2">
              {step > 1 ? (
                <Button variant="outline" onClick={goToPreviousStep}>
                  Back
                </Button>
              ) : null}

              {step === 3 ? (
                <Button
                  variant="ghost"
                  onClick={() => void submitProfile(true)}
                  disabled={isSubmitting}
                >
                  Skip for now
                </Button>
              ) : null}
            </div>

            {step < 3 ? (
              <Button
                onClick={goToNextStep}
                disabled={
                  (step === 1 && !canContinueStepOne) ||
                  (step === 2 && !canContinueStepTwo)
                }
              >
                Continue
                <ChevronRightIcon />
              </Button>
            ) : (
              <Button
                onClick={() => void submitProfile(false)}
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? "Creating workspace..." : "Finish setup"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
