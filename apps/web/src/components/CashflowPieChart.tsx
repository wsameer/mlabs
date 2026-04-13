import { useMemo } from "react";
import { Label, Pie, PieChart } from "recharts";
import type { CategoryTotalsResponse } from "@workspace/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import { NoData } from "./NoData";

const FALLBACK_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type CashflowPieChartProps = {
  data: CategoryTotalsResponse | undefined;
  isLoading: boolean;
};

export function CashflowPieChart({ data, isLoading }: CashflowPieChartProps) {
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

  return <PieChartContent data={data} />;
}

function PieChartContent({ data }: { data: CategoryTotalsResponse }) {
  const chartData = useMemo(
    () =>
      data.items.map((item, i) => ({
        category: item.categoryName,
        total: Number(item.total),
        fill: item.categoryColor ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      })),
    [data.items]
  );

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    data.items.forEach((item, i) => {
      config[item.categoryName] = {
        label: item.categoryName,
        color:
          item.categoryColor ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      };
    });
    return config;
  }, [data.items]);

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
