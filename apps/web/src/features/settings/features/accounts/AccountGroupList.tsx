import { PlusIcon } from "lucide-react";

import type { Account, AccountGroupType } from "@workspace/types";
import type { AccountGroupMetadata } from "@/features/accounts/lib/account-groups";

import { ItemGroup } from "@workspace/ui/components/item";
import { DropdownMenuItem } from "@workspace/ui/components/dropdown-menu";

import { CollapsibleGroup } from "@/components/CollapsibleGroup";
import { AccountItem } from "./AccountItem";

interface AccountGroupListProps {
  group: AccountGroupType;
  meta: AccountGroupMetadata;
  accounts: Account[];
  onAdd: (group: AccountGroupType) => void;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export function AccountGroupList({
  group,
  meta,
  accounts,
  onAdd,
  onEdit,
  onDelete,
}: AccountGroupListProps) {
  return (
    <CollapsibleGroup
      id={`account-group-${group}`}
      label={meta.label}
      icon={meta.icon}
      count={accounts.length}
      defaultOpen
      actions={
        <DropdownMenuItem onClick={() => onAdd(group)}>
          <PlusIcon />
          Add {meta.label.toLowerCase()} account
        </DropdownMenuItem>
      }
    >
      {accounts.length === 0 ? (
        <p className="px-2 py-1 text-xs text-muted-foreground">
          No {meta.label.toLowerCase()} accounts.
        </p>
      ) : (
        <ItemGroup>
          {accounts.map((account) => (
            <AccountItem
              key={account.id}
              account={account}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ItemGroup>
      )}
    </CollapsibleGroup>
  );
}
