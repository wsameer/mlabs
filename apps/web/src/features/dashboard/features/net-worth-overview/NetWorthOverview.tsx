import { useMemo } from "react";
import { calculateAccountTotals, formatCurrency } from "@/features/accounts";
import type { Account } from "@workspace/types";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { useCashflowMonthly } from "./use-cashflow-monthly";

const chartConfig = {
  income: {
    label: "Income",
    color: "var(--color-emerald-500)",
  },
  expense: {
    label: "Expense",
    color: "var(--color-red-500)",
  },
} satisfies ChartConfig;

const MONTH_INITIAL = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MONTH_LABEL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type ChartPoint = {
  monthKey: string;
  monthInitial: string;
  monthLabel: string;
  income: number;
  expense: number;
};

type Prop = {
  accounts: Account[];
  currency: string;
};

export function NetWorthOverview({ accounts, currency }: Prop) {
  const { netWorth } = calculateAccountTotals(accounts);
  const { data, isPending } = useCashflowMonthly();

  const chartData = useMemo<ChartPoint[]>(() => {
    if (!data) return [];
    return data.items.map((item) => {
      const [yearStr, monthStr] = item.month.split("-");
      const monthIdx = Math.max(0, Math.min(11, Number(monthStr) - 1));
      return {
        monthKey: item.month,
        monthInitial: MONTH_INITIAL[monthIdx],
        monthLabel: `${MONTH_LABEL[monthIdx]} ${yearStr}`,
        income: Number(item.income) || 0,
        expense: Number(item.expense) || 0,
      };
    });
  }, [data]);

  return (
    <Card size="sm" className="gap-1">
      <CardHeader>
        <header>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Net worth
          </p>
          <p className="mt-1 text-2xl text-foreground tabular-nums">
            {formatCurrency(netWorth, currency)}
          </p>
        </header>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {isPending ? (
          <Skeleton className="h-36 w-full" />
        ) : (
          <ChartContainer className="h-36 w-full" config={chartConfig}>
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="monthInitial"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_value, payload) =>
                      payload?.[0]?.payload?.monthLabel ?? ""
                    }
                    formatter={(value, name) => (
                      <span className="flex w-full justify-between gap-4">
                        <span className="text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]
                            ?.label ?? name}
                        </span>
                        <span className="font-mono font-medium tabular-nums">
                          {formatCurrency(Number(value), currency)}
                        </span>
                      </span>
                    )}
                  />
                }
              />
              <defs>
                <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-income)"
                    stopOpacity={0.6}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-income)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
                <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-expense)"
                    stopOpacity={0.6}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-expense)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <Area
                dataKey="income"
                type="monotone"
                fill="url(#fillIncome)"
                stroke="var(--color-income)"
                strokeWidth={1.5}
              />
              <Area
                dataKey="expense"
                type="monotone"
                fill="url(#fillExpense)"
                stroke="var(--color-expense)"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
