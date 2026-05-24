import { Separator } from "@workspace/ui/components/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Item, ItemContent } from "@workspace/ui/components/item";

import { SummaryRow } from "./SummaryRow";

export function TransactionTotals({
  income,
  expenses,
  net,
}: {
  income: number;
  expenses: number;
  net: number;
}) {
  return (
    <Card size="sm" className="min-w-0">
      <CardHeader>
        <CardTitle className="text-xs text-muted-foreground uppercase tabular-nums">
          Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end">
        <Item variant="muted" className="flex-col items-stretch">
          <ItemContent className="gap-3">
            <SummaryRow label="Income" value={income} variant="income" />
            <SummaryRow label="Expenses" value={expenses} variant="expense" />
            <Separator />
            <SummaryRow label="Net" value={net} variant="net" />
          </ItemContent>
        </Item>
      </CardContent>
    </Card>
  );
}
