import { useLayoutConfig } from "@/features/layout/hooks/use-layout-config";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useAccounts } from "@/features/accounts/api/use-accounts";
import { useAppStore } from "@/stores";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { AlertCircleIcon } from "lucide-react";
import { Empty } from "@workspace/ui/components/empty";
import { calculateAccountTotals, formatCurrency } from "@/features/accounts";
import { useAppProfile } from "@/hooks/use-app";
import { useEffect } from "react";
import { MainGoals } from "./components/MainGoals";
import { useCategoryTotals } from "./api/use-category-totals";
import { FinancialHealthCard } from "./components/FinancialHealthCard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import { Bar, BarChart, XAxis } from "recharts";
import { Badge } from "@workspace/ui/components/badge";

const activityData = [
  { month: "Jan", amount: 40 },
  { month: "Feb", amount: 55 },
  { month: "Mar", amount: 35 },
  { month: "Apr", amount: 60 },
  { month: "May", amount: 45 },
  { month: "Jun", amount: 50 },
  { month: "Jul", amount: 65 },
  { month: "Aug", amount: 40 },
  { month: "Sep", amount: 55 },
  { month: "Oct", amount: 70 },
  { month: "Nov", amount: 45 },
  { month: "Dec", amount: 80 },
];

const chartConfig = {
  amount: {
    label: "Activity",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function DashboardPage() {
  const { data: accounts, isPending, isError } = useAccounts();
  const setHasAccount = useAppStore((state) => state.setHasAccount);
  const hasAccounts = (accounts?.length ?? 0) > 0;

  useLayoutConfig({
    pageTitle: "Dashboard",
  });

  const profile = useAppProfile();
  const currency = profile?.currency ?? "CAD";

  const incomeQuery = useCategoryTotals({ type: "INCOME" });
  const expenseQuery = useCategoryTotals({ type: "EXPENSE" });

  useEffect(() => {
    if (accounts) {
      setHasAccount(accounts.length > 0);
    }
  }, [accounts, setHasAccount]);

  const incomeTotal = incomeQuery.data
    ? Number(incomeQuery.data.grandTotal)
    : null;
  const expenseTotal = expenseQuery.data
    ? Number(expenseQuery.data.grandTotal)
    : null;

  if (isPending) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto my-auto w-full max-w-2xl">
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Could not load accounts</AlertTitle>
          <AlertDescription>
            There was a problem fetching accounts. Please try again in a moment.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!hasAccounts) {
    return (
      <div className="mx-auto my-auto w-full max-w-2xl">
        <Empty />
      </div>
    );
  }

  const { netWorth } = calculateAccountTotals(accounts);

  return (
    <div className="flex flex-1 flex-col gap-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
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
            <div className="flex items-center justify-between">
              <CardDescription>Yearly Activity</CardDescription>
              <Badge variant="secondary">+CAD$0.25 Daily Cash</Badge>
            </div>
            <ChartContainer config={chartConfig} className="h-24 w-full">
              <BarChart
                data={activityData}
                margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
              >
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={4}
                  axisLine={false}
                  tickFormatter={(v) => String(v).slice(0, 1)}
                  className="text-[10px]"
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                  dataKey="amount"
                  fill="var(--color-amount)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter>This is only for the last year</CardFooter>
        </Card>
        <MainGoals />
        <FinancialHealthCard
          income={incomeTotal}
          expenses={expenseTotal}
          currency={currency}
          isLoading={incomeQuery.isLoading || expenseQuery.isLoading}
          disclaimer="Based on income and expenses for lifetime"
        />
      </div>
      <Card className="min-h-screen flex-1 rounded-xl md:min-h-min">
        <CardHeader>
          <CardTitle>Cashflow</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
