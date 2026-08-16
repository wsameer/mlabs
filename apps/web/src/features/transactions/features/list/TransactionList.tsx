import { useMemo } from "react";
import type { Transaction } from "@workspace/types";

import { Card, CardContent } from "@workspace/ui/components/card";

import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { groupByDate } from "../../lib/group-by-date";
import { calculateTransactionGroupTotals } from "../../lib/calculate-transaction-group-totals";
import type {
  TransactionAccountLookup,
  TransactionCategoryLookup,
} from "./types";
import { TransactionDateGroup } from "./components/TransactionDateGroup";

interface TransactionListProps {
  transactions: Transaction[];
  categoryMap: TransactionCategoryLookup;
  accountMap: TransactionAccountLookup;
  onEditTransaction: (transaction: Transaction) => void;
  accountIdFilter?: string;
}

export function TransactionList({
  transactions,
  categoryMap,
  accountMap,
  onEditTransaction,
  accountIdFilter,
}: TransactionListProps) {
  const { grouped, sortedDates, totalsByDate } = useMemo(() => {
    const groupedTransactions = groupByDate(transactions);
    const totals: Record<string, { income: number; debit: number }> = {};

    for (const dateKey of Object.keys(groupedTransactions)) {
      totals[dateKey] = calculateTransactionGroupTotals(
        groupedTransactions[dateKey]
      );
    }

    return {
      grouped: groupedTransactions,
      totalsByDate: totals,
      sortedDates: Object.keys(groupedTransactions).sort((a, b) =>
        b.localeCompare(a)
      ),
    };
  }, [transactions]);

  return (
    <Card className="m-0.5 min-h-0 min-w-0 flex-1 p-0">
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <ScrollArea className="h-full">
          <div>
            {sortedDates.map((date) => {
              const groupedTransactions = grouped[date];

              const totals = totalsByDate[date] ?? {
                income: 0,
                debit: 0,
              };

              return (
                <TransactionDateGroup
                  key={date}
                  date={date}
                  transactions={groupedTransactions}
                  totals={totals}
                  categoryMap={categoryMap}
                  accountMap={accountMap}
                  onEditTransaction={onEditTransaction}
                  accountIdFilter={accountIdFilter}
                />
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
