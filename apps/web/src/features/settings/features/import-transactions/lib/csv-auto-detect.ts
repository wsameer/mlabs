import type { AmountMode, ColumnMapping, TransactionField } from "../types";

const FIELD_PATTERNS: Record<TransactionField, string[]> = {
  date: [
    "date",
    "transaction date",
    "posted date",
    "trans date",
    "posting date",
    "value date",
  ],
  amount: ["amount", "sum", "total", "value"],
  debit: ["debit", "withdrawal", "outflow", "expense", "debit amount"],
  credit: ["credit", "deposit", "inflow", "income", "credit amount"],
  description: [
    "description",
    "payee",
    "merchant",
    "memo",
    "name",
    "details",
    "narrative",
    "particulars",
  ],
  category: ["category", "group", "tag", "label"],
  notes: ["notes", "note", "reference", "ref", "comment"],
};

function normalize(header: string): string {
  return header.toLowerCase().trim();
}

export function autoDetectColumns(headers: string[]): {
  mapping: ColumnMapping;
  amountMode: AmountMode;
} {
  const mapping: ColumnMapping = {};
  const normalizedHeaders = headers.map(normalize);

  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    const index = normalizedHeaders.findIndex((h) =>
      patterns.some((p) => h === p || h.includes(p))
    );
    if (index !== -1) {
      mapping[field as TransactionField] = index;
    }
  }

  // Determine amount mode
  const hasDebit = mapping.debit != null;
  const hasCredit = mapping.credit != null;
  const hasAmount = mapping.amount != null;

  const amountMode: AmountMode =
    hasDebit && hasCredit && !hasAmount ? "split" : "signed";

  return { mapping, amountMode };
}

export const MAPPABLE_FIELDS: {
  field: TransactionField;
  label: string;
  required: boolean;
}[] = [
  { field: "date", label: "Date", required: true },
  { field: "amount", label: "Amount", required: false },
  { field: "debit", label: "Debit", required: false },
  { field: "credit", label: "Credit", required: false },
  { field: "description", label: "Description", required: false },
  { field: "category", label: "Category", required: false },
  { field: "notes", label: "Notes", required: false },
];
