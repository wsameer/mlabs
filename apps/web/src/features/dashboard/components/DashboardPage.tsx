import { useState } from "react";
import { format } from "date-fns";
import { CashflowPieChart } from "@/components/CashflowPieChart";
import { useLayoutConfig } from "@/features/layout/hooks/use-layout-config";
import { TimeGrainSelect } from "@/components/TimeGrainSelect";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { CategoryStatList } from "@/components/CategoryStatList";
import { DateRangeFilter } from "@/features/filters/DateRangeFilter";
import { useDateRange } from "@/hooks/use-filters";
import { useCategoryTotals } from "../api/use-category-totals";

type TabType = "INCOME" | "EXPENSE";

export function DashboardPage() {
  useLayoutConfig({
    pageTitle: "Dashboard",
    actions: <TimeGrainSelect />,
  });

  const [activeTab, setActiveTab] = useState<TabType>("EXPENSE");
  const dateRange = useDateRange();

  const { data, isLoading } = useCategoryTotals({
    startDate: format(dateRange.from, "yyyy-MM-dd"),
    endDate: format(dateRange.to, "yyyy-MM-dd"),
    type: activeTab,
  });

  const renderTransactionsSummary = () => (
    <>
      <Card className="w-full border-none">
        <CardContent>
          <CashflowPieChart data={data} isLoading={isLoading} />
        </CardContent>
      </Card>
      <CategoryStatList data={data?.items ?? []} />
    </>
  );

  return (
    <div className="flex w-full flex-col gap-3 lg:w-1/3">
      <DateRangeFilter />
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
        <TabsContent value="income">{renderTransactionsSummary()}</TabsContent>
        <TabsContent value="expense">{renderTransactionsSummary()}</TabsContent>
      </Tabs>
    </div>
  );
}
