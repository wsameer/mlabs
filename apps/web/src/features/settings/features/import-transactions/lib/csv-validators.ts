import { parse, isValid } from "date-fns";
import type { RowValidation } from "../types";

const DATE_FORMATS = [
  "yyyy-MM-dd",
  "MM/dd/yyyy",
  "dd/MM/yyyy",
  "M/d/yyyy",
  "d/M/yyyy",
  "yyyy/MM/dd",
  "dd-MM-yyyy",
  "MM-dd-yyyy",
  "MMM d, yyyy",
  "MMMM d, yyyy",
  "d MMM yyyy",
];

/**
 * Try parsing a date string against common formats.
 * Returns a YYYY-MM-DD string or null if unparseable.
 */
export function parseDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Try native Date first (handles ISO and many common formats)
  const native = new Date(trimmed);
  if (isValid(native) && !isNaN(native.getTime())) {
    const y = native.getFullYear();
    // Reject clearly wrong years
    if (y >= 1900 && y <= 2100) {
      const m = String(native.getMonth() + 1).padStart(2, "0");
      const d = String(native.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }

  // Try date-fns parse with known formats
  const ref = new Date();
  for (const fmt of DATE_FORMATS) {
    const parsed = parse(trimmed, fmt, ref);
    if (isValid(parsed)) {
      const y = parsed.getFullYear();
      if (y >= 1900 && y <= 2100) {
        const m = String(parsed.getMonth() + 1).padStart(2, "0");
        const d = String(parsed.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    }
  }

  return null;
}

/**
 * Parse and validate an amount string.
 * Returns the numeric value or null if invalid.
 */
export function parseAmount(value: string): number | null {
  const cleaned = value.trim().replace(/[$,\s]/g, "");
  if (!cleaned) return null;

  // Handle accounting format: (100.00) means -100.00
  const isNegativeParens = /^\([\d.]+\)$/.test(cleaned);
  const numStr = isNegativeParens ? "-" + cleaned.slice(1, -1) : cleaned;

  const num = Number(numStr);
  return Number.isFinite(num) ? num : null;
}

export function validateRow(
  date: string,
  amount: string,
  description: string
): RowValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!parseDate(date)) {
    errors.push(`Invalid date: "${date}"`);
  }

  const parsedAmount = parseAmount(amount);
  if (parsedAmount === null) {
    errors.push(`Invalid amount: "${amount}"`);
  } else if (parsedAmount === 0) {
    warnings.push("Amount is zero");
  }

  if (!description.trim()) {
    warnings.push("No description");
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}
