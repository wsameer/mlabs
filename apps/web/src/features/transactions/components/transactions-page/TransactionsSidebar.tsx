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
      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Summary
        </h3>
        <SummaryRow label="Income" value={income} variant="income" />
        <SummaryRow label="Expenses" value={expenses} variant="expense" />
        <Separator />
        <SummaryRow label="Net" value={net} variant="net" />
      </section>

      {/* Spending by Category */}
      {categories.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Spending by Category
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              title="Set budgets"
              onClick={() => toast.info("Budgeting is coming soon!")}
            >
              <SettingsIcon className="size-3" />
            </Button>
          </div>
          <ItemGroup>
            {categories.map((cat) => (
              <Item
                key={cat.id}
                variant="muted"
                className="flex-col items-stretch"
              >
                <ItemContent className="flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <ItemDescription className="flex items-center gap-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      <span
                        className="inline-block size-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            cat.color ?? "var(--muted-foreground)",
                        }}
                      />
                      <span className="truncate">
                        {cat.icon ? `${cat.icon} ` : ""}
                        {cat.name}
                      </span>
                    </ItemDescription>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCurrency(cat.total)}
                    </span>
                  </div>
                  <Progress value={100} />
                </ItemContent>
                <ItemFooter>
                  <span className="text-xs text-muted-foreground">
                    100% of budget
                  </span>
                  <span className="text-xs font-medium tabular-nums">
                    {cat.percentage}% of total
                  </span>
                </ItemFooter>
              </Item>
            ))}
          </ItemGroup>
        </section>
      )}

      {/* By Account */}
      {accounts.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            By Account
          </h3>
          <div className="flex flex-col gap-1.5">
            {accounts.map((acct) => (
              <div key={acct.id} className="flex items-center gap-2 text-xs">
                <span className="truncate">{acct.name}</span>
                <span className="ml-auto shrink-0 text-muted-foreground tabular-nums">
                  {acct.percentage}%
                </span>
                <span className="w-20 shrink-0 text-right tabular-nums">
                  {formatCurrency(acct.total)}
                </span>
              </div>
            ))}
          </div>
        </section>
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
    <div className="p-3">
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
          "text-xs font-medium tabular-nums",
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
