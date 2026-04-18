import { useState, useMemo } from "react";
import {
  ChevronDownIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  WalletCardsIcon,
} from "lucide-react";

import type { Account, AccountGroup } from "@workspace/types";
import { useAccounts } from "@/features/accounts/api/use-accounts";
import {
  ACCOUNT_GROUP_METADATA,
  type AccountGroupMetadata,
} from "@/features/accounts/lib/account-groups";

import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import { ButtonGroup } from "@workspace/ui/components/button-group";
import {
  Item,
  ItemGroup,
  ItemContent,
  ItemActions,
  ItemTitle,
  ItemDescription,
} from "@workspace/ui/components/item";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";

import { AddAccountDialog } from "./AddAccountDialog";
import { EditAccountDialog } from "./EditAccountDialog";
import { DeleteAccountDialog } from "./DeleteAccountDialog";

type GroupedAccounts = {
  group: AccountGroup;
  meta: AccountGroupMetadata;
  accounts: Account[];
};

export function AccountsSection() {
  const { data: accounts, isPending } = useAccounts();

  // Group accounts by their group field
  const grouped = useMemo<GroupedAccounts[]>(() => {
    if (!accounts?.length) return [];

    const map = new Map<AccountGroup, Account[]>();
    for (const account of accounts) {
      const list = map.get(account.group) ?? [];
      list.push(account);
      map.set(account.group, list);
    }

    return Array.from(map.entries()).map(([group, accts]) => ({
      group,
      meta: ACCOUNT_GROUP_METADATA[group],
      accounts: accts,
    }));
  }, [accounts]);

  // Expanded groups
  const [expanded, setExpanded] = useState<Set<AccountGroup>>(
    () => new Set(Object.keys(ACCOUNT_GROUP_METADATA) as AccountGroup[])
  );

  function toggleExpand(group: AccountGroup) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  // Add dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addDefaultGroup, setAddDefaultGroup] = useState<
    AccountGroup | undefined
  >();

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  function handleAdd(group?: AccountGroup) {
    setAddDefaultGroup(group);
    setAddOpen(true);
  }

  function handleEdit(account: Account) {
    setEditAccount(account);
    setEditOpen(true);
  }

  function handleDelete(account: Account) {
    setDeleteTarget(account);
    setDeleteOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Content */}
      {isPending ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      ) : !grouped.length ? (
        <Empty className="rounded-xl border-none py-16 md:rounded-lg md:border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WalletCardsIcon />
            </EmptyMedia>
            <EmptyTitle>No accounts</EmptyTitle>
            <EmptyDescription>
              Add your first account to start tracking your finances.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-5">
          {grouped.map(({ group, meta, accounts: groupAccounts }) => {
            const Icon = meta.icon;
            const isExpanded = expanded.has(group);

            return (
              <div key={group} className="flex flex-col gap-2">
                {/* Group header */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex flex-1 items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-muted/50"
                    onClick={() => toggleExpand(group)}
                  >
                    <Icon
                      className="size-3.5 shrink-0"
                      style={{ color: meta.color }}
                    />
                    <span className="text-xs font-medium">{meta.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {groupAccounts.length}
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
                    onClick={() => handleAdd(group)}
                  >
                    <PlusIcon className="size-3" />
                  </Button>
                </div>

                {/* Accounts in this group */}
                {isExpanded && (
                  <ItemGroup>
                    {groupAccounts.map((account) => (
                      <Item key={account.id} variant="outline" size="xs">
                        <ItemContent>
                          <ItemTitle>{account.name}</ItemTitle>
                          {account.institutionName && (
                            <ItemDescription>
                              {account.institutionName}
                            </ItemDescription>
                          )}
                        </ItemContent>

                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {parseFloat(account.balance).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>

                        <ItemActions>
                          <ButtonGroup
                            aria-label="Account actions"
                            className="w-fit gap-0.5!"
                          >
                            <ButtonGroup>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Edit"
                                onClick={() => handleEdit(account)}
                              >
                                <PencilIcon className="size-3.5" />
                              </Button>
                            </ButtonGroup>
                            <ButtonGroup>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Delete"
                                onClick={() => handleDelete(account)}
                              >
                                <Trash2Icon className="size-3.5" />
                              </Button>
                            </ButtonGroup>
                          </ButtonGroup>
                        </ItemActions>
                      </Item>
                    ))}
                  </ItemGroup>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <AddAccountDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultGroup={addDefaultGroup}
      />

      <EditAccountDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        account={editAccount}
      />

      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        account={deleteTarget}
      />
    </div>
  );
}
