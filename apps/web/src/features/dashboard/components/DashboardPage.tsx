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
import { DateRangeFilter } from "@/components/DateRangeFilter";

export function DashboardPage() {
  useLayoutConfig({
    pageTitle: "Dashboard",
    actions: <TimeGrainSelect />,
  });

  const renderTransactionsSummary = () => (
    <>
      <Card className="w-full border-none">
        <CardContent>
          <CashflowPieChart />
        </CardContent>
      </Card>
      <CategoryStatList data={[]} />
    </>
  );

  return (
    <div className="flex w-full flex-col gap-3 lg:w-1/3">
      <DateRangeFilter />
      <Tabs defaultValue="expense" className="w-full">
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
