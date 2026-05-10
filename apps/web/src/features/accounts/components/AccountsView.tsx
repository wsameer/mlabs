import { useMemo } from "react";
import type { Account, AccountGroupType } from "@workspace/types";

import { ACCOUNT_GROUP_METADATA } from "../lib/account-groups";
import { AccountGroupSection } from "./AccountGroupSection";
import { AccountCard } from "./AccountCard";
import { calculateGroupTotal } from "../lib/account-calculations";
import { Card, CardContent } from "@workspace/ui/components/card";

interface AccountsViewProps {
  accounts: Account[];
}

export function AccountsView({ accounts }: AccountsViewProps) {
  const groupedAccounts = useMemo(() => {
    const groups: Partial<Record<AccountGroupType, Account[]>> = {};

    accounts.forEach((account) => {
      if (!groups[account.group]) {
        groups[account.group] = [];
      }
      groups[account.group]!.push(account);
    });

    Object.keys(groups).forEach((key) => {
      groups[key as AccountGroupType]!.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return a.name.localeCompare(b.name);
      });
    });

    return groups;
  }, [accounts]);

  const currency = accounts[0]?.currency ?? "CAD";

  return (
    <div className="flex w-1/3 flex-col gap-1">
      {Object.entries(groupedAccounts).map(([group, groupAccounts], index) => {
        const metadata = ACCOUNT_GROUP_METADATA[group as AccountGroupType];
        const groupTotal = calculateGroupTotal(groupAccounts);

        return (
          <Card key={group} size="sm" className="mb-1">
            <CardContent>
              <AccountGroupSection
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
