import type {
  CategoryWithSubcategories,
  BulkCreateIncomeExpense,
} from "@workspace/types";
import type {
  AmountMode,
  ColumnMapping,
  TransferLeg,
  ValidatedRow,
} from "../types";
import { parseDate, parseAmount, validateRow } from "./csv-validators";

function getCell(row: string[], index: number | null | undefined): string {
  if (index == null || index < 0 || index >= row.length) return "";
  return row[index] ?? "";
}

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
    if (debit === 0 && credit != null) return Math.abs(credit);
    if (credit === 0 && debit != null) return -Math.abs(debit);
    return null;
  }

  const amountStr = getCell(row, mapping.amount);
  return parseAmount(amountStr);
}

const TYPE_ALIASES: Record<string, "INCOME" | "EXPENSE"> = {
  income: "INCOME",
  credit: "INCOME",
  deposit: "INCOME",
  "transfer-in": "INCOME",
  "transfer in": "INCOME",
  "xfer-in": "INCOME",
  expense: "EXPENSE",
  debit: "EXPENSE",
  withdrawal: "EXPENSE",
  "transfer-out": "EXPENSE",
  "transfer out": "EXPENSE",
  "xfer-out": "EXPENSE",
};

type TypeResolution = {
  type: "INCOME" | "EXPENSE";
  isTransferLeg: boolean;
  transferLeg?: TransferLeg;
  warning?: string;
};

function resolveType(
  rawType: string,
  resolvedAmount: number | null
): TypeResolution {
  const fallback: TypeResolution = {
    type: resolvedAmount != null && resolvedAmount >= 0 ? "INCOME" : "EXPENSE",
    isTransferLeg: false,
  };

  const normalized = rawType.trim().toLowerCase();
  if (!normalized) return fallback;

  const mapped = TYPE_ALIASES[normalized];
  if (!mapped) {
    return { ...fallback, warning: `Unknown type "${rawType}"` };
  }

  const isTransferLeg = normalized.startsWith("transfer");
  const transferLeg: TransferLeg | undefined = isTransferLeg
    ? mapped === "INCOME"
      ? "IN"
      : "OUT"
    : undefined;

  return { type: mapped, isTransferLeg, transferLeg };
}

function buildSubcategoryIndex(
  categories: CategoryWithSubcategories[]
): Map<string, { parentId: string; subcategoryId: string }> {
  const index = new Map<string, { parentId: string; subcategoryId: string }>();
  for (const parent of categories) {
    const parentName = parent.name.trim().toLowerCase();
    for (const sub of parent.subcategories ?? []) {
      const key = `${parentName}|||${sub.name.trim().toLowerCase()}`;
      index.set(key, { parentId: parent.id, subcategoryId: sub.id });
    }
  }
  return index;
}

type ResolvedCategory = {
  categoryId?: string;
  subcategoryId?: string;
  warning?: string;
};

function resolveCategory(
  categoryRaw: string,
  subcategoryRaw: string,
  parentByName: Map<string, string>,
  subIndex: Map<string, { parentId: string; subcategoryId: string }>
): ResolvedCategory {
  const categoryName = categoryRaw.trim().toLowerCase();
  const subName = subcategoryRaw.trim().toLowerCase();

  if (!categoryName) return {};

  const parentId = parentByName.get(categoryName);

  if (!subName) {
    return { categoryId: parentId };
  }

  const subHit = subIndex.get(`${categoryName}|||${subName}`);
  if (subHit) {
    return { categoryId: subHit.parentId, subcategoryId: subHit.subcategoryId };
  }

  return {
    categoryId: parentId,
    warning: `Subcategory "${subcategoryRaw.trim()}" not found under "${categoryRaw.trim()}"`,
  };
}

export function transformRows(
  rows: string[][],
  mapping: ColumnMapping,
  amountMode: AmountMode,
  categories: CategoryWithSubcategories[]
): ValidatedRow[] {
  const parentByName = new Map(
    categories.map((c) => [c.name.trim().toLowerCase(), c.id])
  );
  const subIndex = buildSubcategoryIndex(categories);

  return rows.map((row, index) => {
    const dateRaw = getCell(row, mapping.date);
    const descriptionRaw = getCell(row, mapping.description);
    const categoryRaw = getCell(row, mapping.category);
    const subcategoryRaw = getCell(row, mapping.subcategory);
    const typeRaw = getCell(row, mapping.type);
    const transferIdRaw = getCell(row, mapping.transferId);
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

    const typeRes = resolveType(typeRaw, resolvedAmount);
    if (typeRes.warning) validation.warnings.push(typeRes.warning);

    // Transfer rows don't get categorized — the counter-leg account carries
    // the meaning, and the TRANSFER type is self-describing.
    const catRes = typeRes.isTransferLeg
      ? {}
      : resolveCategory(categoryRaw, subcategoryRaw, parentByName, subIndex);
    if (catRes.warning) validation.warnings.push(catRes.warning);

    const transferId = transferIdRaw.trim() || undefined;

    return {
      index,
      raw: row,
      date: parsedDate ?? dateRaw,
      amount: amountStr,
      type: typeRes.type,
      isTransferLeg: typeRes.isTransferLeg,
      transferLeg: typeRes.transferLeg,
      description: descriptionRaw.trim(),
      category: typeRes.isTransferLeg ? "" : categoryRaw.trim(),
      categoryId: catRes.categoryId,
      subcategory: typeRes.isTransferLeg ? "" : subcategoryRaw.trim(),
      subcategoryId: catRes.subcategoryId,
      notes: notesRaw.trim(),
      transferId,
      validation,
    } satisfies ValidatedRow;
  });
}

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
      subcategoryId: r.subcategoryId,
      amount: r.amount,
      description: r.description || undefined,
      notes: r.notes || undefined,
      date: r.date,
      isCleared: false,
      transferId: r.transferId,
    }));
}
