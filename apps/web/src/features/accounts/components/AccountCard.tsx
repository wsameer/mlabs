import { Building2Icon } from "lucide-react";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import type { Account } from "@workspace/types";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item";

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
}

export function AccountCard({ account, onClick }: AccountCardProps) {
  const balance = parseFloat(account.balance);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: account.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Item variant="outline" size="xs" role="listitem">
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
        <ItemDescription>{formatCurrency(balance)}</ItemDescription>
      </ItemContent>
    </Item>
  );
}
