import { useUiActions } from "@/hooks/use-ui-store";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { LinkIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

type Props = {
  size?:
    | "icon"
    | "default"
    | "xs"
    | "sm"
    | "lg"
    | "icon-xs"
    | "icon-sm"
    | "icon-lg";
};
export function AddAccount({ size = "default" }: Props) {
  const { setOpenCreateAccount } = useUiActions();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size={size} />}>
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
  );
}
