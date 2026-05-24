import { formatCurrency } from "@/features/accounts/lib/format-utils";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Item, ItemContent, ItemGroup } from "@workspace/ui/components/item";
import { ScrollArea } from "@workspace/ui/components/scroll-area";

import type { AccountBreakdown } from "./types";

export function AccountActivityCard({
  accounts,
}: {
  accounts: AccountBreakdown[];
}) {
  if (accounts.length === 0) return null;

  return (
    <Card size="sm" className="min-h-0 min-w-0 flex-1">
      <CardHeader>
        <CardTitle className="text-xs text-muted-foreground uppercase tabular-nums">
          By Account
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <ItemGroup>
            {accounts.map((account) => (
              <Item key={account.id} variant="muted" size="xs">
                <ItemContent className="truncate">
                  <p className="truncate">{account.name}</p>
                </ItemContent>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge variant="outline">{account.percentage}%</Badge>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(account.total)}
                  </span>
                </div>
              </Item>
            ))}
          </ItemGroup>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
