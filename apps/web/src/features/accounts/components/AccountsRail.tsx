import { useMemo } from "react";

import type { Account } from "@workspace/types";

import { ACCOUNT_GROUP_METADATA } from "../lib/account-groups";
import {
  calculateAccountTotals,
  calculateGroupTotals,
} from "../lib/account-calculations";
import { formatCurrency } from "../lib/format-utils";

interface AccountsRailProps {
  accounts: Account[];
  currency: string;
}

export function AccountsRail({ accounts, currency }: AccountsRailProps) {
  const { netWorth } = calculateAccountTotals(accounts);

  const groups = useMemo(() => {
    return calculateGroupTotals(accounts).sort((a, b) => {
      // Assets first, then liabilities
      if (a.isLiability !== b.isLiability) return a.isLiability ? 1 : -1;
      return Math.abs(b.total) - Math.abs(a.total);
    });
  }, [accounts]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div>
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Net worth
        </p>
        <p className="text-foreground mt-0.5 text-xl tabular-nums">
          {formatCurrency(netWorth, currency)}
        </p>
      </div>

      <div className="flex flex-col gap-0.5">
        <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
          Accounts
        </p>
        {groups.map(({ group, total, count, isLiability }) => {
          const meta = ACCOUNT_GROUP_METADATA[group];
          const Icon = meta.icon;
          return (
            <div
              key={group}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
            >
              <Icon
                className="text-muted-foreground size-3.5 shrink-0"
                aria-hidden
              />
              <span className="text-foreground flex-1 truncate">
                {meta.label}
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {count}
              </span>
              <span className="text-foreground w-20 text-right text-xs tabular-nums">
                {formatCurrency(
                  isLiability ? Math.abs(total) : total,
                  currency
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
