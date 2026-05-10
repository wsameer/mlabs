import { useMemo } from "react";

import type { Account } from "@workspace/types";

import { ACCOUNT_GROUP_METADATA } from "../lib/account-groups";
import { calculateGroupTotals } from "../lib/account-calculations";
import { formatCurrency } from "../lib/format-utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item";

interface AccountsRailProps {
  accounts: Account[];
  currency: string;
}

export function AccountsRail({ accounts, currency }: AccountsRailProps) {
  const groups = useMemo(() => {
    return calculateGroupTotals(accounts).sort((a, b) => {
      // Assets first, then liabilities
      if (a.isLiability !== b.isLiability) return a.isLiability ? 1 : -1;
      return Math.abs(b.total) - Math.abs(a.total);
    });
  }, [accounts]);

  return (
    <Card className="m-1 mt-2">
      <CardHeader>
        <CardTitle>Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {groups.map(({ group, total, count, isLiability }) => {
            const meta = ACCOUNT_GROUP_METADATA[group];
            const Icon = meta.icon;

            return (
              <Item variant={"muted"} size="xs">
                <ItemMedia variant="icon">
                  <Icon
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    {meta.label}{" "}
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {count}
                    </span>
                  </ItemTitle>
                </ItemContent>
                <ItemActions>
                  {formatCurrency(
                    isLiability ? Math.abs(total) : total,
                    currency
                  )}
                </ItemActions>
              </Item>
            );
          })}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
