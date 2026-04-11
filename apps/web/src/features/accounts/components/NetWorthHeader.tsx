import { useMemo } from "react";
import { TrendingUpIcon, InfoIcon } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { cn } from "@workspace/ui/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";

interface NetWorthHeaderProps {
  netWorth: number;
  change: number;
  changePercent: number;
  period: string;
  data: Array<{ date: string; value: number }>;
  currency?: string;
}

export function NetWorthHeader({
  netWorth,
  change,
  changePercent,
  period,
  data,
  currency = "CAD",
}: NetWorthHeaderProps) {
  const isPositive = change >= 0;
  const currencySymbol = currency === "CAD" ? "$" : "$";

  const chartConfig = useMemo(
    () => ({
      value: {
        label: "Net Worth",
        color: "hsl(var(--primary))",
      },
    }),
    []
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatCompactCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency,
      notation: "compact",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            NET WORTH
          </h2>
          <Tooltip>
            <TooltipTrigger>
              <InfoIcon className="size-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Total assets minus total liabilities</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Net Worth Value */}
      <div className="mb-2">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold tracking-tight">
            {formatCurrency(netWorth)}
          </span>
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium",
              isPositive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            )}
          >
            <TrendingUpIcon
              className={cn(
                "size-4",
                !isPositive && "rotate-180 transform"
              )}
            />
            <span>
              {currencySymbol}
              {Math.abs(change).toLocaleString("en-CA", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              ({Math.abs(changePercent).toFixed(1)}%)
            </span>
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{period} change</p>
      </div>

      {/* Chart */}
      <div className="mt-6">
        <ChartContainer
          config={chartConfig}
          className="h-[200px] w-full"
          initialDimension={{ width: 800, height: 200 }}
        >
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={5}
              tickFormatter={(value) => formatCompactCurrency(value)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                  formatter={(value) => [formatCurrency(Number(value)), "Net Worth"]}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#netWorthGradient)"
              fillOpacity={1}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}
