import { useMemo } from "react";
import type { Transaction } from "@workspace/types";
import { Card, CardContent } from "@workspace/ui/components/card";
import { formatCurrency } from "@/features/accounts/lib/format-utils";
import { calculateTransactionGroupTotals } from "../utils";

interface TransactionSummaryCardProps {
  transactions: Transaction[];
}

export function TransactionSummaryCard({
  transactions,
}: TransactionSummaryCardProps) {
  const totals = useMemo(() => {
    const { income, debit } = calculateTransactionGroupTotals(transactions);
    const net = income - debit;
    return { income, expense: debit, net };
  }, [transactions]);

  return (
    <Card className="p-2">
      <CardContent className="p-0">
        <div className="grid w-full grid-cols-3 divide-x divide-border/60">
          <div className="px-2 text-center">
            <div className="text-[0.65rem] text-muted-foreground uppercase">
              Income
            </div>
            <div className="text-sm font-medium">
              {formatCurrency(totals.income)}
            </div>
          </div>
          <div className="px-2 text-center">
            <div className="text-[0.65rem] text-muted-foreground uppercase">
              Expense
            </div>
            <div className="text-sm font-medium">
              {formatCurrency(totals.expense)}
            </div>
          </div>
          <div className="px-2 text-center">
            <div className="text-[0.65rem] text-muted-foreground uppercase">
              Total
            </div>
            <div className="text-sm font-medium">
              {formatCurrency(totals.net)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
