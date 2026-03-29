import { BanknoteArrowUpIcon } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";

import { useLayoutConfig } from "@/features/layout";
import { TRANSACTIONS_ROUTE } from "@/constants";
import { cn } from "@workspace/ui/lib/utils";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { TimeGrainSelect } from "@/features/TimeGrainSelect";
import { Card, CardContent } from "@workspace/ui/components/card";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import React from "react";
import { TransactionItem } from "@/features/add-transaction/components/TransactionItem";
import { Separator } from "@workspace/ui/components/separator";
import type { TransactionItemProps } from "@/features/add-transaction/types";
import { Item, ItemActions, ItemContent } from "@workspace/ui/components/item";
import { Badge } from "@workspace/ui/components/badge";

export const Route = createFileRoute(TRANSACTIONS_ROUTE)({
  component: RouteComponent,
});

const DEMO_TRANSACTIONS: TransactionItemProps[] = [
  {
    id: 1,
    category: "Utilities",
    categorySub: "Heat & Hydro",
    merchant: "Metergy Solutions",
    merchantSub: "TD Chequing Bank",
    txDate: "Today",
    amount: "$600.00",
    sign: "debit",
  },
  {
    id: 2,
    category: "Groceries",
    categorySub: "Food & Drink",
    merchant: "Whole Foods Market",
    merchantSub: "Visa Infinite",
    txDate: "Yesterday",
    amount: "$143.72",
    sign: "debit",
  },
  {
    id: 3,
    category: "Income",
    categorySub: "Direct Deposit",
    merchant: "Payroll — Acme Corp Ltd.",
    merchantSub: "TD Chequing Bank",
    txDate: "Mar 21",
    amount: "+$4,200.00",
    sign: "credit",
  },
  {
    category: "Subscriptions",
    id: 4,
    categorySub: "Software & Services",
    merchant: "Adobe Creative Cloud Annual Plan",
    merchantSub: "Mastercard",
    txDate: "Mar 20",
    amount: "$69.99",
    sign: "debit",
  },
];

function EmptyTransactions() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BanknoteArrowUpIcon />
        </EmptyMedia>
        <EmptyTitle>No transactions found</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t added any transactions yet. Get started by adding an
          expense or income.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button>Add a transaction</Button>
        <Tooltip>
          <TooltipTrigger
            render={<Button variant="outline">Import Transactions</Button>}
          />
          <TooltipContent>
            <p>Coming soon</p>
          </TooltipContent>
        </Tooltip>
      </EmptyContent>
    </Empty>
  );
}

function RouteComponent() {
  useLayoutConfig({
    pageTitle: "Transactions",
    actions: <TimeGrainSelect />,
  });

  const isEmpty = DEMO_TRANSACTIONS.length === 0;

  return (
    <div
      className={cn("flex w-full flex-col gap-3", {
        "mx-auto my-auto": isEmpty,
        "lg:w-1/2": !isEmpty,
      })}
    >
      {isEmpty ? (
        <EmptyTransactions />
      ) : (
        <div className="flex flex-col gap-3">
          <DateRangeFilter />
          <Card className="p-2">
            <CardContent>
              <div className="grid w-full grid-cols-3 divide-x divide-border/60">
                <div className="px-2 text-center">
                  <div className="text-[0.65rem] text-muted-foreground uppercase">
                    Income
                  </div>
                  <div className="text-sm font-medium tabular-nums">{1224}</div>
                </div>
                <div className="px-2 text-center">
                  <div className="text-[0.65rem] text-muted-foreground uppercase">
                    Expense
                  </div>
                  <div className="text-sm font-medium tabular-nums">{869}</div>
                </div>
                <div className="px-2 text-center">
                  <div className="text-[0.65rem] text-muted-foreground uppercase">
                    Total
                  </div>
                  <div className="text-sm font-medium tabular-nums">$1000</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardContent className="p-0">
              <ScrollArea className="h-[70svh]">
                <div>
                  <Item className="sticky top-0 h-12 items-center justify-between gap-4 rounded-none bg-primary px-3">
                    <ItemContent className="flex flex-row items-center gap-1">
                      <p className="text-base">24</p>
                      <Badge variant="secondary">Thu</Badge>
                    </ItemContent>
                    <ItemActions>
                      <small className="w-16 truncate font-mono text-xs text-foreground tabular-nums">
                        $0.00
                      </small>
                      <small className="w-16 truncate text-right font-mono text-xs text-foreground tabular-nums">
                        $10.00
                      </small>
                    </ItemActions>
                  </Item>
                  <div>
                    {DEMO_TRANSACTIONS.map((tx, i) => (
                      <React.Fragment key={tx.id}>
                        <TransactionItem key={i} {...tx} />
                        <Separator className="m-0" />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div>
                  <Item className="sticky top-0 h-12 items-center justify-between gap-4 rounded-none bg-primary px-3">
                    <ItemContent className="flex flex-row items-center gap-1">
                      <p className="text-base">23</p>
                      <Badge variant="secondary">Wed</Badge>
                    </ItemContent>
                    <ItemActions>
                      <small className="w-16 truncate font-mono text-xs text-foreground tabular-nums">
                        $0.00
                      </small>
                      <small className="w-16 truncate text-right font-mono text-xs text-foreground tabular-nums">
                        $10.00
                      </small>
                    </ItemActions>
                  </Item>
                  <div>
                    {DEMO_TRANSACTIONS.map((tx, i) => (
                      <React.Fragment key={tx.id}>
                        <TransactionItem key={i} {...tx} />
                        <Separator className="m-0" />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div>
                  <Item className="sticky top-0 h-12 items-center justify-between gap-4 rounded-none bg-primary px-3">
                    <ItemContent className="flex flex-row items-center gap-1">
                      <p className="text-base">22</p>
                      <Badge variant="secondary">Tue</Badge>
                    </ItemContent>
                    <ItemActions>
                      <small className="w-16 truncate font-mono text-xs text-foreground tabular-nums">
                        $0.00
                      </small>
                      <small className="w-16 truncate text-right font-mono text-xs text-foreground tabular-nums">
                        $10.00
                      </small>
                    </ItemActions>
                  </Item>
                  <div>
                    {DEMO_TRANSACTIONS.map((tx, i) => (
                      <React.Fragment key={tx.id}>
                        <TransactionItem key={i} {...tx} />
                        <Separator className="m-0" />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
