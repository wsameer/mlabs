import { Building2Icon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Account } from "@workspace/types";

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { cn } from "@workspace/ui/lib/utils";

import { TRANSACTIONS_ROUTE } from "@/constants";
import type { AccountGroupMetadata } from "../lib/account-groups";
import { formatCurrency, getInitials } from "../lib/format-utils";
import { Badge } from "@workspace/ui/components/badge";

interface AccountTileProps {
  account: Account;
  groupMeta: AccountGroupMetadata;
}

export function AccountTile({ account, groupMeta }: AccountTileProps) {
  let balance = parseFloat(account.balance);

  if (balance === 0) {
    balance = 0;
  }
  const accentColor = account.color ?? groupMeta.color;

  return (
    <Link
      to={TRANSACTIONS_ROUTE}
      search={{ accountIds: [account.id] }}
      aria-label={`View transactions for ${account.name}, balance ${formatCurrency(balance, account.currency)}`}
      className={cn(
        "group/item relative flex w-full flex-col flex-wrap gap-2 rounded-md border text-xs/relaxed transition-colors duration-100 outline-none",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "[a]:transition-colors [a]:hover:bg-muted",
        "border-border bg-card",
        "gap-2.5 px-2.5 py-2 in-data-[slot=dropdown-menu-content]:p-0"
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
        <Badge variant="outline" style={{ color: accentColor }}>
          {groupMeta.label}
        </Badge>
      </div>

      <div className="min-w-0">
        <p className="overflow-hidden text-xs tracking-wider text-wrap uppercase">
          {account.name}
        </p>
        {account.institutionName && (
          <p className="w-11/12 truncate text-xs text-ellipsis text-muted-foreground">
            {account.institutionName}
          </p>
        )}
      </div>

      <p className="cn-font-heading mt-auto text-lg tabular-nums">
        {formatCurrency(balance, account.currency)}
      </p>
    </Link>
  );
}
