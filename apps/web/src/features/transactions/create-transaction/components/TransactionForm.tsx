import type { TransactionType } from "@workspace/types";

import { IncomeExpenseForm } from "./IncomeExpenseForm";
import { TransferForm } from "./TransferForm";

interface TransactionFormProps {
  type: TransactionType;
  className?: string;
}

export function TransactionForm({ type, className }: TransactionFormProps) {
  if (type === "TRANSFER") {
    return <TransferForm className={className} />;
  }
  return <IncomeExpenseForm type={type} className={className} />;
}
