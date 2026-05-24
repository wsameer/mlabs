import { useLayoutConfig } from "@/features/layout/hooks/use-layout-config";
import { Card, CardHeader, CardTitle } from "@workspace/ui/components/card";
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
import { useAppProfile } from "@/hooks/use-app";
import { useEffect } from "react";
import { MainGoals } from "./components/MainGoals";
import { useCategoryTotals } from "./api/use-category-totals";
import { FinancialHealthCard } from "./components/FinancialHealthCard";
import { NetWorthOverview } from "./features/net-worth-overview";

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

  return (
    <div className="flex flex-1 flex-col gap-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <NetWorthOverview accounts={accounts} currency={currency} />
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
