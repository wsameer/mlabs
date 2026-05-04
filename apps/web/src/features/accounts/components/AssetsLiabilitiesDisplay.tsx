import type { Account } from "@workspace/types";
import {
  Item,
  ItemContent,
  ItemDescription,
} from "@workspace/ui/components/item";
import { calculateAccountTotals } from "../lib/account-calculations";
import { formatCurrency } from "../lib/format-utils";

interface AssetsLiabilitiesDisplayProps {
  accounts: Account[];
  currency?: string;
}

export function AssetsLiabilitiesDisplay({
  accounts,
  currency = "CAD",
}: AssetsLiabilitiesDisplayProps) {
  const { assets, liabilities } = calculateAccountTotals(accounts);

  return (
    <div className="grid w-full grid-cols-2 gap-3">
      <Item variant="muted" className="flex-col items-stretch">
        <ItemContent className="gap-1">
          <ItemDescription className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Assets
          </ItemDescription>
          <span className="cn-font-heading text-base tabular-nums">
            {formatCurrency(assets, currency)}
          </span>
        </ItemContent>
      </Item>
      <Item variant="muted" className="flex-col items-stretch">
        <ItemContent className="gap-1">
          <ItemDescription className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Liabilities
          </ItemDescription>
          <span className="cn-font-heading text-base tabular-nums">
            {formatCurrency(liabilities, currency)}
          </span>
        </ItemContent>
      </Item>
    </div>
  );
}
