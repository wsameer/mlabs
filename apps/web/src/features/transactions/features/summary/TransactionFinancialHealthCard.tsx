import { FinancialHealthCard } from "@/features/dashboard/components/FinancialHealthCard";

export function TransactionFinancialHealthCard({
  income,
  expenses,
  currency,
}: {
  income: number;
  expenses: number;
  currency: string;
}) {
  return (
    <FinancialHealthCard
      income={income}
      expenses={expenses}
      currency={currency}
      density="compact"
      className="min-w-0"
      disclaimer="Based on income and expenses in this transaction view."
    />
  );
}
