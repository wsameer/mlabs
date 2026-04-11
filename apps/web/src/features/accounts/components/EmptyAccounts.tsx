import { LandmarkIcon, LinkIcon, PlusIcon } from "lucide-react";
import { useUiActions } from "@/hooks/use-ui-store";
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
import { ButtonGroup } from "@workspace/ui/components/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { toast } from "sonner";

export function EmptyAccounts() {
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
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button />}>
            Add account
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setOpenCreateAccount(true)}>
                <PlusIcon />
                Create account
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  toast("Coming later", {
                    description:
                      "This functionality is little complex. I will work on it later once v1 is done",
                  })
                }
              >
                <LinkIcon />
                Link account
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

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
