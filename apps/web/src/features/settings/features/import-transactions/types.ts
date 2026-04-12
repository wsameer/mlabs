export type ImportStep = "upload" | "map" | "preview" | "importing" | "results";

export type TransactionField =
  | "date"
  | "amount"
  | "debit"
  | "credit"
  | "description"
  | "category"
  | "notes";

export type AmountMode = "signed" | "split";

export type ColumnMapping = Partial<Record<TransactionField, number | null>>;

export type RowValidation = {
  isValid: boolean;
  warnings: string[];
  errors: string[];
};

export type ValidatedRow = {
  index: number;
  raw: string[];
  date: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  category: string;
  categoryId?: string;
  notes: string;
  validation: RowValidation;
};

export type ImportResult = {
  imported: number;
  failed: number;
  errors: { index: number; message: string }[];
};
