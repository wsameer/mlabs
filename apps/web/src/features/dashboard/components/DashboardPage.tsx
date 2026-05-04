import { useState, useMemo } from "react";
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
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { buildCategoryColorMap } from "@/lib/category-colors";

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

  const colorMap = useMemo(
    () => buildCategoryColorMap(data?.items ?? []),
    [data?.items]
  );

  const renderTransactionsSummary = () => (
    <ScrollArea className="h-[70svh]">
      <Card className="m-0.5">
        <CardContent>
          <CashflowPieChart
            data={data}
            colorMap={colorMap}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
      <div className="mt-2">
        <CategoryStatList data={data?.items ?? []} colorMap={colorMap} />
      </div>
    </ScrollArea>
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
