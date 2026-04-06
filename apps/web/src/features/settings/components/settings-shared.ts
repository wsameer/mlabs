import {
  SUPPORTED_CURRENCIES,
  type Profile,
  type UpdateProfile,
} from "@workspace/types";

export type SettingsFormValues = Required<UpdateProfile>;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const WORKSPACE_TYPE_LABELS: Record<Profile["type"], string> = {
  PERSONAL: "Personal",
  BUSINESS: "Business",
  SHARED: "Shared",
};

export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  CAD: "CAD - Canadian Dollar",
  USD: "USD - US Dollar",
  EUR: "EUR - Euro",
  GBP: "GBP - British Pound",
};

export const DATE_FORMAT_LABELS: Record<Profile["dateFormat"], string> = {
  "D MMM, YYYY": "20 May, 2026",
  "DD/MM/YYYY": "20/05/2026",
  "MM/DD/YYYY": "05/20/2026",
  "YYYY-MM-DD": "2026-05-20",
};

export const WEEK_START_LABELS: Record<Profile["weekStart"], string> = {
  SUNDAY: "Sunday",
  MONDAY: "Monday",
};

export function getInitials(name: string) {
  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return "ML";
  }

  return trimmedName.slice(0, 2).toUpperCase();
}

export function profileToFormValues(profile: Profile): SettingsFormValues {
  return {
    icon: profile.icon ?? "",
    type: profile.type,
    currency: profile.currency,
    dateFormat: profile.dateFormat,
    weekStart: profile.weekStart,
    notes: profile.notes ?? "",
  };
}
