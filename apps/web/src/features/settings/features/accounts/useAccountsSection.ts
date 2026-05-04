import { useState, useMemo } from "react";

import type { Account, AccountGroupType } from "@workspace/types";
import { useAccounts } from "@/features/accounts/api/use-accounts";
import {
  ACCOUNT_GROUP_METADATA,
  type AccountGroupMetadata,
} from "@/features/accounts/lib/account-groups";

export type GroupedAccounts = {
  group: AccountGroupType;
  meta: AccountGroupMetadata;
  accounts: Account[];
};

export function useAccountsSection() {
  const { data: accounts, isPending } = useAccounts();

  const grouped = useMemo<GroupedAccounts[]>(() => {
    if (!accounts?.length) return [];

    const map = new Map<AccountGroupType, Account[]>();
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
  const [expanded, setExpanded] = useState<Set<AccountGroupType>>(
    () => new Set(Object.keys(ACCOUNT_GROUP_METADATA) as AccountGroupType[])
  );

  function toggleExpand(group: AccountGroupType) {
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
    AccountGroupType | undefined
  >();

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  function handleAdd(group?: AccountGroupType) {
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

  return {
    isPending,
    grouped,
    expanded,
    toggleExpand,
    addOpen,
    setAddOpen,
    addDefaultGroup,
    editOpen,
    setEditOpen,
    editAccount,
    deleteOpen,
    setDeleteOpen,
    deleteTarget,
    handleAdd,
    handleEdit,
    handleDelete,
  };
}
