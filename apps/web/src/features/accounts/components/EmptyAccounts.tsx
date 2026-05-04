import { LandmarkIcon } from "lucide-react";
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
import { AddAccount } from "@/features/add-accounts/AddAccount";

export function EmptyAccounts() {
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
        <AddAccount />
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
