import { useState, useMemo } from "react";
import { format } from "date-fns";
import { CashflowPieChart } from "@/components/CashflowPieChart";
import { useLayoutConfig } from "@/features/layout/hooks/use-layout-config";
import { TimeGrainSelect } from "@/components/TimeGrainSelect";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { CategoryStatList } from "@/components/CategoryStatList";
import { DateRangeFilter } from "@/features/filters/DateRangeFilter";
import { useDateRange } from "@/hooks/use-filters";
import { useAppProfile } from "@/hooks/use-app";
import { useCategoryTotals } from "../api/use-category-totals";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { buildCategoryColorMap } from "@/lib/category-colors";
import { FinancialHealthCard } from "./FinancialHealthCard";

type TabType = "INCOME" | "EXPENSE";

export function DashboardPage() {
  useLayoutConfig({
    pageTitle: "Dashboard",
    actions: <TimeGrainSelect />,
  });

  const [activeTab, setActiveTab] = useState<TabType>("EXPENSE");
  const dateRange = useDateRange();
  const profile = useAppProfile();
  const currency = profile?.currency ?? "CAD";

  const rangeParams = {
    startDate: format(dateRange.from, "yyyy-MM-dd"),
    endDate: format(dateRange.to, "yyyy-MM-dd"),
  };

  const incomeQuery = useCategoryTotals({ ...rangeParams, type: "INCOME" });
  const expenseQuery = useCategoryTotals({ ...rangeParams, type: "EXPENSE" });

  const data = activeTab === "INCOME" ? incomeQuery.data : expenseQuery.data;
  const isLoading =
    activeTab === "INCOME" ? incomeQuery.isLoading : expenseQuery.isLoading;

  const colorMap = useMemo(
    () => buildCategoryColorMap(data?.items ?? []),
    [data?.items]
  );

  const incomeTotal = incomeQuery.data
    ? Number(incomeQuery.data.grandTotal)
    : null;
  const expenseTotal = expenseQuery.data
    ? Number(expenseQuery.data.grandTotal)
    : null;

  const renderTransactionsSummary = () => (
    <>
      <CashflowPieChart data={data} colorMap={colorMap} isLoading={isLoading} />
      <ScrollArea className="h-[32svh] md:h-[42svh]">
        <div className="mt-4">
          <CategoryStatList data={data?.items ?? []} colorMap={colorMap} />
        </div>
      </ScrollArea>
    </>
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div
        id="left-dashboard"
        className="flex w-full flex-col gap-2 lg:max-w-md"
      >
        <DateRangeFilter />
        <Card>
          <CardContent>
            <Tabs
              value={activeTab === "EXPENSE" ? "expense" : "income"}
              onValueChange={(v) =>
                setActiveTab(v === "income" ? "INCOME" : "EXPENSE")
              }
              className="w-full"
            >
              <TabsList className="w-full">
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="expense">Expense</TabsTrigger>
              </TabsList>
              <TabsContent value="income">
                {renderTransactionsSummary()}
              </TabsContent>
              <TabsContent value="expense">
                {renderTransactionsSummary()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-2" id="right-dashboard">
        <div className="flex flex-wrap gap-2 *:min-w-[18rem] *:flex-1">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Contribution chart</CardTitle>
            </CardHeader>
            <CardContent>TDB</CardContent>
          </Card>
          <FinancialHealthCard
            income={incomeTotal}
            expenses={expenseTotal}
            currency={currency}
            isLoading={incomeQuery.isLoading || expenseQuery.isLoading}
          />
        </div>
      </div>
    </div>
  );
}
