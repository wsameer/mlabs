import { PencilIcon, Trash2Icon } from "lucide-react";

import type { Account } from "@workspace/types";

import { Button } from "@workspace/ui/components/button";
import { ButtonGroup } from "@workspace/ui/components/button-group";
import {
  Item,
  ItemContent,
  ItemActions,
  ItemTitle,
  ItemDescription,
} from "@workspace/ui/components/item";

interface AccountItemProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export function AccountItem({ account, onEdit, onDelete }: AccountItemProps) {
  return (
    <Item variant="default" size="xs" className="hover:bg-muted">
      <ItemContent>
        <ItemTitle>{account.name}</ItemTitle>
        {account.institutionName && (
          <ItemDescription>{account.institutionName}</ItemDescription>
        )}
      </ItemContent>

      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {parseFloat(account.balance).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>

      <ItemActions>
        <ButtonGroup aria-label="Account actions" className="w-fit gap-0.5!">
          <ButtonGroup>
            <Button
              variant="outline"
              size="icon-sm"
              title="Edit"
              onClick={() => onEdit(account)}
            >
              <PencilIcon className="size-3" />
            </Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button
              variant="destructive"
              size="icon-sm"
              title="Delete"
              onClick={() => onDelete(account)}
            >
              <Trash2Icon className="size-3" />
            </Button>
          </ButtonGroup>
        </ButtonGroup>
      </ItemActions>
    </Item>
  );
}
