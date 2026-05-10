import { useMemo } from "react";
import { Pie, PieChart } from "recharts";

import type { Account } from "@workspace/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart";

import { ACCOUNT_GROUP_METADATA } from "../lib/account-groups";
import {
  calculateAccountTotals,
  calculateCashOnHand,
  calculateGroupTotals,
} from "../lib/account-calculations";
import { formatCurrency } from "../lib/format-utils";

interface AccountKpisProps {
  accounts: Account[];
  currency: string;
}

export function AccountKpis({ accounts, currency }: AccountKpisProps) {
  const { assets, liabilities } = calculateAccountTotals(accounts);
  const cash = calculateCashOnHand(accounts);

  const assetCount = accounts.filter(
    (a) => a.isActive && !ACCOUNT_GROUP_METADATA[a.group].isLiability
  ).length;
  const liabilityCount = accounts.filter(
    (a) => a.isActive && ACCOUNT_GROUP_METADATA[a.group].isLiability
  ).length;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          label="Assets"
          value={formatCurrency(assets, currency)}
          subLabel={`${assetCount} ${assetCount === 1 ? "account" : "accounts"}`}
        />
        <KpiCard
          label="Liabilities"
          value={formatCurrency(liabilities, currency)}
          subLabel={`${liabilityCount} ${liabilityCount === 1 ? "account" : "accounts"}`}
        />
        <KpiCard
          label="Cash on hand"
          value={formatCurrency(cash, currency)}
          subLabel="Chequing + savings"
        />
      </div>
      <AllocationDonut accounts={accounts} currency={currency} />
    </div>
  );
}

function KpiCard({
  label,
  value,
  subLabel,
}: {
  label: string;
  value: string;
  subLabel?: string;
}) {
  return (
    <Card className="gap-1 p-3">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className="text-foreground text-lg tabular-nums">{value}</p>
      {subLabel && (
        <p className="text-muted-foreground text-xs">{subLabel}</p>
      )}
    </Card>
  );
}

function AllocationDonut({
  accounts,
  currency,
}: {
  accounts: Account[];
  currency: string;
}) {
  const data = useMemo(() => {
    const groupTotals = calculateGroupTotals(accounts).filter(
      (g) => !g.isLiability && g.total > 0
    );
    return groupTotals.map((g) => ({
      group: g.group,
      label: ACCOUNT_GROUP_METADATA[g.group].label,
      total: g.total,
      fill: ACCOUNT_GROUP_METADATA[g.group].color,
    }));
  }, [accounts]);

  const chartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {};
    data.forEach((item) => {
      config[item.label] = { label: item.label, color: item.fill };
    });
    return config;
  }, [data]);

  const totalAssets = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <Card className="flex flex-1 flex-col gap-3 p-3">
      <CardHeader className="p-0">
        <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Asset allocation
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-0">
        {data.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-xs">
            No assets yet.
          </p>
        ) : (
          <div className="flex flex-1 items-center gap-4">
            <ChartContainer
              config={chartConfig}
              className="aspect-square h-full max-h-40 min-h-28 shrink-0"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="label" hideLabel />}
                />
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="label"
                  innerRadius={32}
                  outerRadius={56}
                  strokeWidth={2}
                />
              </PieChart>
            </ChartContainer>
            <ul className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs">
              {data.map((slice) => {
                const pct =
                  totalAssets > 0
                    ? Math.round((slice.total / totalAssets) * 100)
                    : 0;
                return (
                  <li key={slice.group} className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: slice.fill }}
                    />
                    <span className="text-foreground flex-1 truncate">
                      {slice.label}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {pct}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {data.length > 0 && (
          <p className="text-muted-foreground mt-3 text-xs">
            Total assets:{" "}
            <span className="text-foreground tabular-nums">
              {formatCurrency(totalAssets, currency)}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
