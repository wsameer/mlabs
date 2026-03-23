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
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import React from "react";
import { TransactionItem } from "@/features/add-transaction/components/TransactionItem";
import { Separator } from "@workspace/ui/components/separator";
import { ItemGroup } from "@workspace/ui/components/item";

export const Route = createFileRoute(TRANSACTIONS_ROUTE)({
  component: RouteComponent,
});

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

const tags = Array.from({ length: 10 }).map(
  (_, i, a) => `v1.2.0-beta.${a.length - i}`
);

function RouteComponent() {
  useLayoutConfig({
    pageTitle: "Transactions",
    actions: <TimeGrainSelect />,
  });

  const isEmpty = false;

  return (
    <div
      className={cn("", {
        "mx-auto my-auto": isEmpty,
      })}
    >
      {isEmpty ? (
        <EmptyTransactions />
      ) : (
        <div className="flex flex-col gap-3">
          <DateRangeFilter />
          <Card className="p-2">
            <CardHeader className="p-0">
              <div className="grid grid-cols-3 items-center justify-items-center-safe">
                <div className="w-full text-center">
                  <p className="mb-2 text-xs text-muted-foreground">Income</p>
                  <p className="font-mono text-sm leading-none font-medium">
                    $1000
                  </p>
                </div>
                <div className="w-full border-x text-center">
                  <p className="mb-2 text-xs text-muted-foreground">Expenses</p>
                  <p className="font-mono text-sm leading-none font-medium">
                    $1000
                  </p>
                </div>
                <div className="w-full text-center">
                  <p className="mb-2 text-xs text-muted-foreground">Total</p>
                  <p className="font-mono text-sm leading-none font-medium">
                    $1000
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="p-0">
            <CardContent className="p-0">
              <ScrollArea className="h-[70svh]">
                <div>
                  <div className="sticky top-0 flex h-12 items-center bg-primary px-4">
                    <h4 className="text-sm font-semibold">Order #4189</h4>
                  </div>
                  <div>
                    {tags.map((tag) => (
                      <React.Fragment key={tag}>
                        <TransactionItem tag={tag} />
                        <Separator className="m-0" />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="sticky top-0 flex h-12 items-center bg-primary px-4">
                    <h4 className="text-sm font-semibold">Order #4189</h4>
                  </div>
                  <div>
                    {tags.map((tag) => (
                      <React.Fragment key={tag}>
                        <TransactionItem tag={tag} />
                        <Separator className="m-0" />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="sticky top-0 flex h-12 items-center bg-primary px-4">
                    <h4 className="text-sm font-semibold">Order #4189</h4>
                  </div>
                  <div>
                    {tags.map((tag) => (
                      <React.Fragment key={tag}>
                        <TransactionItem tag={tag} />
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
