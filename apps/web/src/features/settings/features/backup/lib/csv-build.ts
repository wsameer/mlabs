import type { CategoryWithSubcategories, Transaction } from "@workspace/types";

export const EXPORT_HEADERS = [
  "Date",
  "Amount",
  "Type",
  "Description",
  "Category",
  "Subcategory",
  "Transfer ID",
  "Notes",
] as const;

export function escapeCell(value: string): string {
  if (value === "") return "";
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCategoryNameMap(
  categories: CategoryWithSubcategories[]
): Map<string, string> {
  const byId = new Map<string, string>();
  for (const parent of categories) {
    byId.set(parent.id, parent.name);
    for (const sub of parent.subcategories ?? []) {
      byId.set(sub.id, sub.name);
    }
  }
  return byId;
}

function csvType(t: Transaction): string {
  if (t.type === "TRANSFER") {
    return t.direction === "INFLOW" ? "transfer-in" : "transfer-out";
  }
  return t.type === "INCOME" ? "income" : "expense";
}

export function transactionsToCsv(
  transactions: Transaction[],
  categories: CategoryWithSubcategories[]
): string {
  const nameById = buildCategoryNameMap(categories);

  const lines: string[] = [];
  lines.push(EXPORT_HEADERS.join(","));

  for (const t of transactions) {
    const categoryName = t.categoryId ? (nameById.get(t.categoryId) ?? "") : "";
    const subcategoryName = t.subcategoryId
      ? (nameById.get(t.subcategoryId) ?? "")
      : "";

    const cells = [
      t.date,
      t.signedAmount,
      csvType(t),
      t.description ?? "",
      categoryName,
      subcategoryName,
      t.transferId ?? "",
      t.notes ?? "",
    ].map(escapeCell);

    lines.push(cells.join(","));
  }

  return lines.join("\n") + "\n";
}

export function buildExportFilename(accountName: string, today: Date): string {
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const slug = accountName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `mlabs-${slug || "account"}-${yyyy}-${mm}-${dd}.csv`;
}
