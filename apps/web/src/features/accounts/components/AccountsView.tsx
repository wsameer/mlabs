import { useMemo } from "react";
import type { Account, AccountGroupType } from "@workspace/types";

import { ACCOUNT_GROUP_METADATA } from "../lib/account-groups";
import { AccountTile } from "./AccountTile";

interface AccountsViewProps {
  accounts: Account[];
}

// Stable order — we want active tiles to flow in a deterministic group order
// regardless of insertion timing.
const GROUP_ORDER: AccountGroupType[] = [
  "chequing",
  "savings",
  "cash",
  "credit_card",
  "investment",
  "loan",
  "mortgage",
  "asset",
  "other",
];

export function AccountsView({ accounts }: AccountsViewProps) {
  const sortedAccounts = useMemo(() => {
    const orderIndex = new Map(GROUP_ORDER.map((g, i) => [g, i]));
    return [...accounts].sort((a, b) => {
      const ga = orderIndex.get(a.group) ?? Infinity;
      const gb = orderIndex.get(b.group) ?? Infinity;
      if (ga !== gb) return ga - gb;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
  }, [accounts]);

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
      {sortedAccounts.map((account) => {
        const meta = ACCOUNT_GROUP_METADATA[account.group];
        return (
          <AccountTile key={account.id} account={account} groupMeta={meta} />
        );
      })}
    </div>
  );
}
