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

// Hide leader-line labels for very small slices — unless the donut has few
// enough wedges that there's plenty of room to show them all.
const FEW_SLICES_THRESHOLD = 4;
const MIN_PCT_FOR_LABEL = 0.02;

export function CashflowPieChart({
  data,
  colorMap,
  isLoading,
}: CashflowPieChartProps) {
  if (isLoading) {
    return (
      <div className="flex h-62.5 items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!data?.items.length) {
    return <NoData />;
  }

  return <PieChartContent data={data} colorMap={colorMap} />;
}

type SliceLabelArgs = {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  percent: number;
  value: number;
  fill: string;
};

function renderSliceLabel(props: SliceLabelArgs, totalSlices: number) {
  const { cx, cy, midAngle, outerRadius, percent, value, fill } = props;

  if (totalSlices > FEW_SLICES_THRESHOLD && percent < MIN_PCT_FOR_LABEL) {
    return null;
  }

  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sliceEdgeX = cx + outerRadius * cos;
  const sliceEdgeY = cy + outerRadius * sin;
  const elbowX = cx + (outerRadius + 10) * cos;
  const elbowY = cy + (outerRadius + 10) * sin;
  const labelAnchorX = elbowX + (cos >= 0 ? 1 : -1) * 14;
  const labelAnchorY = elbowY;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <path
        d={`M${sliceEdgeX},${sliceEdgeY}L${elbowX},${elbowY}L${labelAnchorX},${labelAnchorY}`}
        stroke={fill}
        strokeWidth={1}
        fill="none"
      />
      <circle cx={labelAnchorX} cy={labelAnchorY} r={2} fill={fill} />
      <text
        x={labelAnchorX + (cos >= 0 ? 4 : -4)}
        y={labelAnchorY}
        textAnchor={textAnchor}
        dominantBaseline="central"
        className="fill-foreground text-[11px] tabular-nums"
      >
        ${Math.round(value).toLocaleString()}
      </text>
    </g>
  );
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
  const totalSlices = chartData.length;

  return (
    <ChartContainer config={chartConfig} className="aspect-square h-72 w-full">
      <PieChart margin={{ top: 24, right: 56, bottom: 24, left: 56 }}>
        <ChartTooltip
          content={<ChartTooltipContent nameKey="category" hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="total"
          nameKey="category"
          innerRadius={70}
          outerRadius={102}
          strokeWidth={2}
          labelLine={false}
          label={(props) =>
            renderSliceLabel(props as SliceLabelArgs, totalSlices)
          }
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
                      className="fill-foreground text-xl font-bold"
                    >
                      ${Math.round(grandTotal).toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 20}
                      className="fill-muted-foreground text-[11px]"
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
