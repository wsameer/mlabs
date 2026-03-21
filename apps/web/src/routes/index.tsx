import { DASHBOARD_ROUTE } from "@/constants";
import { CashflowPieChart } from "@/features/CashflowPieChart";
import { useLayoutConfig } from "@/features/layout/hooks/use-layout-config";
import { TimeGrainSelect } from "@/features/TimeGrainSelect";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";

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

  const renderIncomeSection = () => (
    <Card className="w-full">
      <CardContent>
        <CashflowPieChart />
      </CardContent>
    </Card>
  );

  return (
    <div>
      <Tabs defaultValue="expense" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expense">Expense</TabsTrigger>
        </TabsList>
        <TabsContent value="income">
          {renderIncomeSection()}
          <div className="my-4 flex flex-col gap-1">
            {testData.map((item) => (
              <Item
                variant="outline"
                size="xs"
                key={item.id}
                render={
                  <a href="#">
                    <ItemMedia>
                      <Badge className="w-[48px]" variant="destructive">
                        {item.weight}
                      </Badge>
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{item.category}</ItemTitle>
                    </ItemContent>
                    <ItemActions>
                      <p className="leading-7 [&:not(:first-child)]:mt-6">
                        ${item.value}
                      </p>
                    </ItemActions>
                  </a>
                }
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="expense">
          {renderIncomeSection()}
          <div className="my-4 flex flex-col gap-1">
            {testData.map((item) => (
              <Item
                variant="outline"
                size="xs"
                key={item.id}
                render={
                  <a href="#">
                    <ItemMedia>
                      <Badge className="w-[48px]" variant="destructive">
                        {item.weight}
                      </Badge>
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{item.category}</ItemTitle>
                    </ItemContent>
                    <ItemActions>
                      <p className="leading-7 [&:not(:first-child)]:mt-6">
                        ${item.value}
                      </p>
                    </ItemActions>
                  </a>
                }
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
