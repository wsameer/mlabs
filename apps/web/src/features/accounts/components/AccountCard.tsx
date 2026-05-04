import { Building2Icon } from "lucide-react";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import type { Account } from "@workspace/types";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item";
import { formatCurrency, getInitials } from "../lib/format-utils";

interface AccountCardProps {
  account: Account;
}

export function AccountCard({ account }: AccountCardProps) {
  const balance = parseFloat(account.balance);

  return (
    <Item variant="muted" size="xs" role="listitem">
      <ItemMedia>
        <Avatar className="size-8">
          <AvatarFallback
            className="rounded text-[10px] font-medium"
            style={{
              backgroundColor: account.color
                ? `${account.color}20`
                : "hsl(var(--muted))",
              color: account.color ?? "hsl(var(--foreground))",
            }}
          >
            {account.institutionName ? (
              getInitials(account.institutionName)
            ) : (
              <Building2Icon className="size-4" />
            )}
          </AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{account.name}</ItemTitle>
        {account.institutionName && (
          <ItemDescription>{account.institutionName}</ItemDescription>
        )}
      </ItemContent>
      <ItemContent className="flex-none text-center">
        <ItemDescription>
          {formatCurrency(balance, account.currency)}
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}
