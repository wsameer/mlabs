import { useMemo } from "react";
import { Label, Pie, PieChart } from "recharts";
import type { CategoryTotalsResponse } from "@workspace/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import type { CategoryColorMap } from "@/lib/category-colors";
import { NoData } from "./NoData";

type CashflowPieChartProps = {
  data: CategoryTotalsResponse | undefined;
  colorMap: CategoryColorMap;
  isLoading: boolean;
};

export function CashflowPieChart({
  data,
  colorMap,
  isLoading,
}: CashflowPieChartProps) {
  if (isLoading) {
    return (
      <div className="flex h-[250px] items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!data?.items.length) {
    return <NoData />;
  }

  return <PieChartContent data={data} colorMap={colorMap} />;
}

function PieChartContent({
  data,
  colorMap,
}: {
  data: CategoryTotalsResponse;
  colorMap: CategoryColorMap;
}) {
  const chartData = useMemo(
    () =>
      data.items.map((item) => ({
        category: item.categoryName,
        total: Number(item.total),
        fill: colorMap[item.categoryId ?? "uncategorized"],
      })),
    [data.items, colorMap]
  );

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    data.items.forEach((item) => {
      config[item.categoryName] = {
        label: item.categoryName,
        color: colorMap[item.categoryId ?? "uncategorized"],
      };
    });
    return config;
  }, [data.items, colorMap]);

  const grandTotal = Number(data.grandTotal);

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[250px]"
    >
      <PieChart>
        <ChartTooltip
          content={<ChartTooltipContent nameKey="category" hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="total"
          nameKey="category"
          innerRadius={60}
          strokeWidth={5}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-2xl font-bold"
                    >
                      ${grandTotal.toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground text-sm"
                    >
                      Total
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
