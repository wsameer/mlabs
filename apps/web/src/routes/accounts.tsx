import { ACCOUNTS_ROUTE } from "@/constants";
import { useLayoutConfig } from "@/features/layout";
import { useUiActions } from "@/hooks/use-ui-store";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { LandmarkIcon } from "lucide-react";

export const Route = createFileRoute(ACCOUNTS_ROUTE)({
  component: RouteComponent,
});

function EmptyAccounts() {
  const { setOpenCreateAccount } = useUiActions();

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LandmarkIcon />
        </EmptyMedia>
        <EmptyTitle>No Account Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t created any accounts yet. Get started by adding your
          first bank account.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button onClick={() => setOpenCreateAccount(true)}>
          Create Account
        </Button>
        <Tooltip>
          <TooltipTrigger
            render={<Button variant="outline">Import Accounts</Button>}
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
    pageTitle: "Accounts",
  });

  return (
    <div className="mx-auto my-auto">
      <EmptyAccounts />
    </div>
  );
}
