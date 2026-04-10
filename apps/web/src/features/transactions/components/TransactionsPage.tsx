import { BanknoteArrowUpIcon } from "lucide-react";
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
import { TimeGrainSelect } from "@/components/TimeGrainSelect";
import type { TransactionItemProps } from "../types";

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

export function TransactionsPage() {
  useLayoutConfig({
    pageTitle: "Transactions",
    actions: <TimeGrainSelect />,
  });

  // TODO: Replace with real transaction data from API
  const transactions: TransactionItemProps[] = [];
  const isEmpty = transactions.length === 0;

  return (
    <div className="mx-auto my-auto flex w-full flex-col gap-3">
      <EmptyTransactions />
    </div>
  );
}
