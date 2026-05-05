import { ChevronDownIcon, PlusIcon } from "lucide-react";

import type { Account, AccountGroupType } from "@workspace/types";
import type { AccountGroupMetadata } from "@/features/accounts/lib/account-groups";

import { Button } from "@workspace/ui/components/button";
import { ItemGroup } from "@workspace/ui/components/item";

import { AccountItem } from "./AccountItem";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";

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

      <Card size="sm">
        <CardHeader onClick={() => onToggle(group)}>
          <CardTitle className="flex flex-row items-center-safe gap-1">
            <Icon className="size-3.5 shrink-0" style={{ color: meta.color }} />
            {meta.label}
            <Badge variant="default">{accounts.length}</Badge>
          </CardTitle>
          <CardAction className="flex flex-row items-center gap-1">
            <Button variant="secondary" size="icon-sm">
              <ChevronDownIcon
                className={`transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`}
              />
            </Button>
            <Button
              variant="secondary"
              size="icon-sm"
              title={`Add ${meta.label.toLowerCase()} account`}
              onClick={(e) => {
                e.preventDefault();
                onAdd(group);
              }}
            >
              <PlusIcon />
            </Button>
          </CardAction>
        </CardHeader>

        {/* Accounts in this group */}
        {isExpanded && (
          <CardContent>
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
          </CardContent>
        )}
      </Card>
    </div>
  );
}
