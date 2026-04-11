import { useMemo } from "react";
import type { Account, AccountGroup } from "@workspace/types";

import { ACCOUNT_GROUP_METADATA } from "../lib/account-groups";
import { AccountGroupSection } from "./AccountGroupSection";
import { AccountCard } from "./AccountCard";
import { calculateGroupTotal } from "../lib/account-calculations";

interface AccountsViewProps {
  accounts: Account[];
}

export function AccountsView({ accounts }: AccountsViewProps) {
  // Group accounts by type
  const groupedAccounts = useMemo(() => {
    const groups: Partial<Record<AccountGroup, Account[]>> = {};

    accounts.forEach((account) => {
      if (!groups[account.group]) {
        groups[account.group] = [];
      }
      groups[account.group]!.push(account);
    });

    // Sort accounts within each group by sortOrder, then by name
    Object.keys(groups).forEach((key) => {
      groups[key as AccountGroup]!.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return a.name.localeCompare(b.name);
      });
    });

    return groups;
  }, [accounts]);

  // Get currency from first account
  const currency = accounts[0]?.currency ?? "CAD";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-2">
      {/* Account Groups */}
      {Object.entries(groupedAccounts).map(([group, groupAccounts], index) => {
        const metadata = ACCOUNT_GROUP_METADATA[group as AccountGroup];
        const groupTotal = calculateGroupTotal(groupAccounts);

        return (
          <AccountGroupSection
            key={group}
            id={group}
            label={metadata.label}
            icon={metadata.icon}
            accountCount={groupAccounts.length}
            total={Math.abs(groupTotal)}
            currency={currency}
            defaultOpen={index === 0}
          >
            {groupAccounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </AccountGroupSection>
        );
      })}
    </div>
  );
}
