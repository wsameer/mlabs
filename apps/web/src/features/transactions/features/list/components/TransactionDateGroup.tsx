import type { Transaction } from "@workspace/types";

import { formatCurrency } from "@/features/accounts/lib/format-utils";
import { parseDateString } from "@/lib/timezone";
import { Badge } from "@workspace/ui/components/badge";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
} from "@workspace/ui/components/item";
import { format } from "date-fns";
import type {
  TransactionAccountLookup,
  TransactionCategoryLookup,
  TransactionGroupTotals,
} from "../types";
import { TransactionListItem } from "./TransactionListItem";

export function TransactionDateGroup({
  date,
  transactions,
  totals,
  categoryMap,
  accountMap,
  onEditTransaction,
  accountIdFilter,
}: {
  date: string;
  transactions: Transaction[];
  totals: TransactionGroupTotals;
  categoryMap: TransactionCategoryLookup;
  accountMap: TransactionAccountLookup;
  onEditTransaction: (transaction: Transaction) => void;
  accountIdFilter?: string;
}) {
  return (
    <section>
      <Item
        id={`summary-${date}`}
        className="sticky top-0 h-12 items-center justify-between gap-4 rounded-none border-b-border bg-muted px-3"
      >
        <ItemContent className="flex flex-row items-center gap-2">
          <Badge className="rounded-sm" variant="default">
            {format(parseDateString(date), "EEE")}
          </Badge>
          <p className="text-xs">
            {format(parseDateString(date), "dd MMM, y")}
          </p>
        </ItemContent>
        <ItemActions>
          <small className="w-16 truncate text-xs text-foreground">
            {formatCurrency(totals.income)}
          </small>
          <small className="w-16 truncate text-right text-xs text-foreground">
            {formatCurrency(totals.debit)}
          </small>
        </ItemActions>
      </Item>

      <ItemGroup className="flex flex-col gap-0">
        {transactions.map((transaction, index) => (
          <TransactionListItem
            key={transaction.id}
            transaction={transaction}
            isLast={transactions.length - 1 === index}
            categoryMap={categoryMap}
            accountMap={accountMap}
            onEditTransaction={onEditTransaction}
            accountIdFilter={accountIdFilter}
          />
        ))}
      </ItemGroup>
    </section>
  );
}
