import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { TimeGrain } from "@workspace/types";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@workspace/ui/components/chart";
import { NetWorthTimeGrainSelect } from "./NetWorthTimeGrainSelect";
import { generateDummyData } from "./dummy-data";

const chartConfig = {
  assets: {
    label: "Assets",
    color: "hsl(150, 60%, 45%)",
  },
  liabilities: {
    label: "Liabilities",
    color: "hsl(350, 70%, 50%)",
  },
  netWorth: {
    label: "Net Worth",
    color: "hsl(200, 70%, 50%)",
  },
} satisfies ChartConfig;

function formatCurrencyTick(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value}`;
}

function formatCurrencyTooltip(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function NetWorthChart() {
  const [grain, setGrain] = useState<TimeGrain>("monthly");
  const data = useMemo(() => generateDummyData(grain), [grain]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth</CardTitle>
        <CardAction>
          <NetWorthTimeGrainSelect value={grain} onChange={setGrain} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-65 w-full">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="fillAssets" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-assets)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-assets)"
                  stopOpacity={0.02}
                />
              </linearGradient>
              <linearGradient id="fillLiabilities" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-liabilities)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-liabilities)"
                  stopOpacity={0.02}
                />
              </linearGradient>
              <linearGradient id="fillNetWorth" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-netWorth)"
                  stopOpacity={0.4}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-netWorth)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              tickFormatter={formatCurrencyTick}
              width={50}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <span className="flex w-full justify-between gap-4">
                      <span className="text-muted-foreground">
                        {chartConfig[name as keyof typeof chartConfig]?.label ??
                          name}
                      </span>
                      <span className="font-mono font-medium tabular-nums">
                        {formatCurrencyTooltip(value as number)}
                      </span>
                    </span>
                  )}
                />
              }
            />
            <Area
              dataKey="assets"
              type="monotone"
              stroke="var(--color-assets)"
              fill="url(#fillAssets)"
              strokeWidth={1.5}
            />
            <Area
              dataKey="liabilities"
              type="monotone"
              stroke="var(--color-liabilities)"
              fill="url(#fillLiabilities)"
              strokeWidth={1.5}
            />
            <Area
              dataKey="netWorth"
              type="monotone"
              stroke="var(--color-netWorth)"
              fill="url(#fillNetWorth)"
              strokeWidth={2}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
