import { createFileRoute } from "@tanstack/react-router";
import { TRANSACTIONS_ROUTE } from "@/constants";
import { useLayoutConfig } from "@/features/layout";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Button } from "@workspace/ui/components/button";
import { BanknoteArrowUpIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";

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

function RouteComponent() {
  useLayoutConfig({
    pageTitle: "Transactions",
  });

  return (
    <div className="mx-auto my-auto">
      <EmptyTransactions />
    </div>
  );
}
