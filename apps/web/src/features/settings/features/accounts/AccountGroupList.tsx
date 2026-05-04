import { ChevronDownIcon, PlusIcon } from "lucide-react";

import type { Account, AccountGroupType } from "@workspace/types";
import type { AccountGroupMetadata } from "@/features/accounts/lib/account-groups";

import { Button } from "@workspace/ui/components/button";
import { ItemGroup } from "@workspace/ui/components/item";

import { AccountItem } from "./AccountItem";

interface AccountGroupListProps {
  group: AccountGroupType;
  meta: AccountGroupMetadata;
  accounts: Account[];
  isExpanded: boolean;
  onToggle: (group: AccountGroupType) => void;
  onAdd: (group: AccountGroupType) => void;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export function AccountGroupList({
  group,
  meta,
  accounts,
  isExpanded,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
}: AccountGroupListProps) {
  const Icon = meta.icon;

  return (
    <div className="flex flex-col gap-2">
      {/* Group header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex flex-1 items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-muted/50"
          onClick={() => onToggle(group)}
        >
          <Icon className="size-3.5 shrink-0" style={{ color: meta.color }} />
          <span className="text-xs font-medium">{meta.label}</span>
          <span className="text-xs text-muted-foreground">
            {accounts.length}
          </span>
          <ChevronDownIcon
            className={`ml-auto size-3 text-muted-foreground transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`}
          />
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          title={`Add ${meta.label.toLowerCase()} account`}
          onClick={() => onAdd(group)}
        >
          <PlusIcon className="size-3" />
        </Button>
      </div>

      {/* Accounts in this group */}
      {isExpanded && (
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
    </div>
  );
}
