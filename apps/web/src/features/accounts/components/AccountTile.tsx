import { Building2Icon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Account } from "@workspace/types";

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { cn } from "@workspace/ui/lib/utils";

import { TRANSACTIONS_ROUTE } from "@/constants";
import type { AccountGroupMetadata } from "../lib/account-groups";
import { formatCurrency, getInitials } from "../lib/format-utils";

interface AccountTileProps {
  account: Account;
  groupMeta: AccountGroupMetadata;
}

export function AccountTile({ account, groupMeta }: AccountTileProps) {
  const balance = parseFloat(account.balance);
  const accentColor = account.color ?? groupMeta.color;

  return (
    <Link
      to={TRANSACTIONS_ROUTE}
      search={{ accountIds: [account.id] }}
      aria-label={`View transactions for ${account.name}, balance ${formatCurrency(balance, account.currency)}`}
      className={cn(
        "group/tile relative flex flex-col gap-2 rounded-md border bg-card p-3",
        "transition-colors hover:border-foreground/15 hover:bg-muted/40",
        "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Avatar className="size-7 rounded-md">
          <AvatarFallback
            className="rounded-md text-[10px] font-medium"
            style={{
              backgroundColor: `${accentColor}1A`,
              color: accentColor,
            }}
          >
            {account.institutionName ? (
              getInitials(account.institutionName)
            ) : (
              <Building2Icon className="size-3.5" />
            )}
          </AvatarFallback>
        </Avatar>
        <span
          className="rounded-sm border px-1.5 py-0.5 text-[9px] font-medium tracking-wide uppercase"
          style={{ borderColor: `${accentColor}33`, color: accentColor }}
        >
          {groupMeta.label}
        </span>
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{account.name}</p>
        {account.institutionName && (
          <p className="truncate text-xs text-muted-foreground">
            {account.institutionName}
          </p>
        )}
      </div>

      <p className="mt-auto text-base font-semibold tabular-nums">
        {formatCurrency(balance, account.currency)}
      </p>
    </Link>
  );
}
