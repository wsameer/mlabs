import { toZonedTime } from "date-fns-tz";

export const DEFAULT_TIMEZONE = "America/Toronto";

/**
 * Get the current moment as a Date whose local fields (getDate, getHours, …)
 * reflect the given IANA timezone. Use this instead of `new Date()` whenever
 * you need "now" for date-range calculations or boundary checks.
 */
export function nowInTz(tz: string = DEFAULT_TIMEZONE): Date {
  return toZonedTime(new Date(), tz);
}

/**
 * Parse a "YYYY-MM-DD" date string into a local-midnight Date.
 * Avoids the UTC-midnight interpretation of `new Date("2026-04-01")`.
 */
export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Format a Date to "YYYY-MM-DD" using its local fields.
 */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Get today's date as a "YYYY-MM-DD" string in the given timezone.
 */
export function todayString(tz: string = DEFAULT_TIMEZONE): string {
  return toDateString(nowInTz(tz));
}
