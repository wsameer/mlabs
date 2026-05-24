import { formatCurrency } from "@/features/accounts/lib/format-utils";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
} from "@workspace/ui/components/item";
import { Progress } from "@workspace/ui/components/progress";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { SettingsIcon } from "lucide-react";
import { toast } from "sonner";

import type { CategoryBreakdown } from "./types";

export function SpendingByCategoryCard({
  categories,
}: {
  categories: CategoryBreakdown[];
}) {
  if (categories.length === 0) return null;

  return (
    <Card size="sm" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <CardHeader className="shrink-0">
        <CardTitle className="text-xs text-muted-foreground uppercase tabular-nums">
          Spending by Category
        </CardTitle>
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            title="Set budgets"
            onClick={() => toast.info("Budgeting is coming soon!")}
            data-testid="tx-summary-budget-settings"
          >
            <SettingsIcon className="size-3" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        <ScrollArea className="h-full">
          <ItemGroup>
            {categories.map((category) => (
              <Item
                key={category.id}
                variant="muted"
                size="sm"
                className="flex-col items-stretch"
              >
                <ItemContent className="gap-3">
                  <ItemDescription className="cn-font-heading text-[9px] font-medium tracking-wider text-muted-foreground uppercase">
                    {category.icon ? `${category.icon} ` : ""}
                    {category.name}
                  </ItemDescription>
                  <div className="flex flex-row justify-between">
                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(category.total)}
                    </span>
                    <span className="text-xs font-medium tabular-nums">
                      {category.percentage}% of total
                    </span>
                  </div>
                  <Progress value={category.percentage} />
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
