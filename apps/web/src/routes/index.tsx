import { DASHBOARD_ROUTE } from "@/constants";
import { CashflowPieChart } from "@/features/CashflowPieChart";
import { useLayoutConfig } from "@/features/layout/hooks/use-layout-config";
import { TimeGrainSelect } from "@/features/TimeGrainSelect";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { CategoryStatList } from "@/features/CategoryStatList";
import { DateRangeFilter } from "@/components/DateRangeFilter";

export const Route = createFileRoute(DASHBOARD_ROUTE)({
  component: RouteComponent,
});

const testData = [
  {
    id: 1,
    category: "Housing",
    weight: "40%",
    value: 4400,
  },
  { id: 2, category: "Groceries", weight: "20%", value: 1400 },
  { id: 3, category: "Food & Dining", weight: "10%", value: 710 },
  { id: 4, category: "Travel", weight: "10%", value: 710 },
  { id: 5, category: "Utilities", weight: "5%", value: 320 },
];

function RouteComponent() {
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
      <CategoryStatList data={testData} />
    </>
  );

  return (
    <div className="flex flex-col gap-3">
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
