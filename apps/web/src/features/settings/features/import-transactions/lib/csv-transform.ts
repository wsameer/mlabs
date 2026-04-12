import type { Category, BulkCreateIncomeExpense } from "@workspace/types";
import type { AmountMode, ColumnMapping, ValidatedRow } from "../types";
import { parseDate, parseAmount, validateRow } from "./csv-validators";

function getCell(row: string[], index: number | null | undefined): string {
  if (index == null || index < 0 || index >= row.length) return "";
  return row[index] ?? "";
}

/**
 * Resolve the amount from a row based on the amount mode.
 * Returns the raw signed amount as a number.
 */
function resolveAmount(
  row: string[],
  mapping: ColumnMapping,
  amountMode: AmountMode
): number | null {
  if (amountMode === "split") {
    const debitStr = getCell(row, mapping.debit);
    const creditStr = getCell(row, mapping.credit);
    const debit = parseAmount(debitStr);
    const credit = parseAmount(creditStr);

    if (debit != null && debit !== 0) return -Math.abs(debit);
    if (credit != null && credit !== 0) return Math.abs(credit);
    // Both present — try the non-zero one
    if (debit === 0 && credit != null) return Math.abs(credit);
    if (credit === 0 && debit != null) return -Math.abs(debit);
    return null;
  }

  const amountStr = getCell(row, mapping.amount);
  return parseAmount(amountStr);
}

/**
 * Transform raw CSV rows into validated rows using the column mapping.
 */
export function transformRows(
  rows: string[][],
  mapping: ColumnMapping,
  amountMode: AmountMode,
  categories: Category[]
): ValidatedRow[] {
  const categoryMap = new Map(
    categories.map((c) => [c.name.toLowerCase().trim(), c.id])
  );

  return rows.map((row, index) => {
    const dateRaw = getCell(row, mapping.date);
    const descriptionRaw = getCell(row, mapping.description);
    const categoryRaw = getCell(row, mapping.category);
    const notesRaw = getCell(row, mapping.notes);

    const resolvedAmount = resolveAmount(row, mapping, amountMode);
    const amountStr =
      resolvedAmount != null ? String(Math.abs(resolvedAmount)) : "";

    const parsedDate = parseDate(dateRaw);

    const validation = validateRow(
      dateRaw,
      resolvedAmount != null ? String(resolvedAmount) : "",
      descriptionRaw
    );

    const type =
      resolvedAmount != null && resolvedAmount >= 0 ? "INCOME" : "EXPENSE";

    const categoryId = categoryRaw
      ? categoryMap.get(categoryRaw.toLowerCase().trim())
      : undefined;

    return {
      index,
      raw: row,
      date: parsedDate ?? dateRaw,
      amount: amountStr,
      type,
      description: descriptionRaw.trim(),
      category: categoryRaw.trim(),
      categoryId,
      notes: notesRaw.trim(),
      validation,
    } satisfies ValidatedRow;
  });
}

/**
 * Convert validated rows into the API payload for bulk create.
 */
export function toApiPayload(
  rows: ValidatedRow[],
  accountId: string
): BulkCreateIncomeExpense[] {
  return rows
    .filter((r) => r.validation.isValid)
    .map((r) => ({
      type: r.type,
      accountId,
      categoryId: r.categoryId,
      amount: r.amount,
      description: r.description || undefined,
      notes: r.notes || undefined,
      date: r.date,
      isCleared: false,
    }));
}
