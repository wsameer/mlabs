import { useMemo, useState } from "react";
import { ChartNoAxesCombinedIcon, SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import type { Transaction } from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Progress } from "@workspace/ui/components/progress";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
} from "@workspace/ui/components/item";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer";
import { formatCurrency } from "@/features/accounts/lib/format-utils";
import { cn } from "@workspace/ui/lib/utils";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";

export interface TransactionsSummaryProps {
  transactions: Transaction[];
  categoryMap: Map<string, { name: string; icon?: string; color?: string }>;
  accountMap: Map<string, string>;
}

interface CategoryBreakdown {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  total: number;
  percentage: number;
}

interface AccountBreakdown {
  id: string;
  name: string;
  total: number;
  percentage: number;
}

function useSummaryData(
  transactions: Transaction[],
  categoryMap: Map<string, { name: string; icon?: string; color?: string }>,
  accountMap: Map<string, string>
) {
  return useMemo(() => {
    let income = 0;
    let expenses = 0;

    const categoryTotals = new Map<string, number>();
    const accountTotals = new Map<string, number>();

    for (const tx of transactions) {
      if (tx.type === "TRANSFER") continue;

      const amount = Number(tx.amount);
      const magnitude = Number.isFinite(amount)
        ? amount
        : Math.abs(Number(tx.signedAmount));

      if (!Number.isFinite(magnitude)) continue;

      if (tx.direction === "INFLOW") {
        income += magnitude;
      } else {
        expenses += magnitude;

        // Category breakdown (expenses only)
        const catKey = tx.categoryId ?? "uncategorized";
        categoryTotals.set(
          catKey,
          (categoryTotals.get(catKey) ?? 0) + magnitude
        );
      }

      // Account breakdown (all non-transfer)
      accountTotals.set(
        tx.accountId,
        (accountTotals.get(tx.accountId) ?? 0) + magnitude
      );
    }

    const net = income - expenses;

    // Build sorted category breakdown
    const categories: CategoryBreakdown[] = Array.from(categoryTotals.entries())
      .map(([id, total]) => {
        const cat = categoryMap.get(id);
        return {
          id,
          name: cat?.name ?? "Uncategorized",
          icon: cat?.icon,
          color: cat?.color,
          total,
          percentage: expenses > 0 ? Math.round((total / expenses) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    // Build sorted account breakdown
    const totalActivity = income + expenses;
    const accounts: AccountBreakdown[] = Array.from(accountTotals.entries())
      .map(([id, total]) => ({
        id,
        name: accountMap.get(id) ?? "Unknown",
        total,
        percentage:
          totalActivity > 0 ? Math.round((total / totalActivity) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return { income, expenses, net, categories, accounts };
  }, [transactions, categoryMap, accountMap]);
}

// ---------------------------------------------------------------------------
// Shared content — rendered inside both the desktop sidebar and mobile drawer
// ---------------------------------------------------------------------------

function SummaryContent({
  income,
  expenses,
  net,
  categories,
  accounts,
}: {
  income: number;
  expenses: number;
  net: number;
  categories: CategoryBreakdown[];
  accounts: AccountBreakdown[];
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Totals */}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs text-muted-foreground uppercase tabular-nums">
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-end">
          <Item variant="muted" className="flex-col items-stretch">
            <ItemContent className="gap-3">
              <SummaryRow label="Income" value={income} variant="income" />
              <SummaryRow label="Expenses" value={expenses} variant="expense" />
              <Separator />
              <SummaryRow label="Net" value={net} variant="net" />
            </ItemContent>
          </Item>
        </CardContent>
      </Card>

      {/* Spending by Category */}
      {categories.length > 0 && (
        <Card size="sm" className="mx-auto w-full max-w-sm">
          <CardHeader>
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
              >
                <SettingsIcon className="size-3" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              <ItemGroup>
                {categories.map((cat) => (
                  <Item
                    key={cat.id}
                    variant="muted"
                    size={"xs"}
                    className="flex-col items-stretch"
                  >
                    <ItemContent className="gap-3">
                      <ItemDescription className="cn-font-heading text-[9px] font-medium tracking-wider text-muted-foreground uppercase">
                        {cat.icon ? `${cat.icon} ` : ""}
                        {cat.name}
                      </ItemDescription>
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(cat.total)}
                      </span>
                      <Progress value={100} />
                    </ItemContent>
                    <ItemFooter>
                      <span className="text-xs text-muted-foreground">
                        100%
                      </span>
                      <span className="text-xs font-medium tabular-nums">
                        {cat.percentage}% of total
                      </span>
                    </ItemFooter>
                  </Item>
                ))}
              </ItemGroup>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* By Account */}
      {accounts.length > 0 && (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground uppercase tabular-nums">
              By Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ItemGroup>
              {accounts.map((acct) => (
                <Item key={acct.id} variant="muted" size={"xs"}>
                  <ItemContent className="truncate">
                    <p className="truncate">{acct.name}</p>
                  </ItemContent>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant="outline">{acct.percentage}%</Badge>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(acct.total)}
                    </span>
                  </div>
                </Item>
              ))}
            </ItemGroup>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop sidebar content (rendered inside layout's left sidebar)
// ---------------------------------------------------------------------------

export function TransactionsSummaryContent({
  transactions,
  categoryMap,
  accountMap,
}: TransactionsSummaryProps) {
  const { income, expenses, net, categories, accounts } = useSummaryData(
    transactions,
    categoryMap,
    accountMap
  );

  return (
    <div className="px-0.5 py-2">
      <SummaryContent
        income={income}
        expenses={expenses}
        net={net}
        categories={categories}
        accounts={accounts}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile summary button + drawer (< lg)
// ---------------------------------------------------------------------------

export function TransactionsSummaryMobile({
  transactions,
  categoryMap,
  accountMap,
}: TransactionsSummaryProps) {
  const [open, setOpen] = useState(false);
  const { income, expenses, net, categories, accounts } = useSummaryData(
    transactions,
    categoryMap,
    accountMap
  );

  return (
    <>
      <Button
        variant="secondary"
        className="lg:hidden"
        title="View summary"
        onClick={() => setOpen(true)}
      >
        <ChartNoAxesCombinedIcon className="size-3" />
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Summary</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="max-h-[70svh] px-4 pb-6">
            <SummaryContent
              income={income}
              expenses={expenses}
              net={net}
              categories={categories}
              accounts={accounts}
            />
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared row
// ---------------------------------------------------------------------------

function SummaryRow({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: "income" | "expense" | "net";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-sm font-medium tabular-nums",
          variant === "income" && "text-emerald-600 dark:text-emerald-400",
          variant === "expense" && "text-red-600 dark:text-red-400",
          variant === "net" && value >= 0
            ? "text-emerald-600 dark:text-emerald-400"
            : variant === "net" && "text-red-600 dark:text-red-400"
        )}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}
