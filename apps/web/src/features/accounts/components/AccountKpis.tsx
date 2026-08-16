import type { Account } from "@workspace/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

import { ACCOUNT_GROUP_METADATA } from "../lib/account-groups";
import {
  calculateAccountTotals,
  calculateCashOnHand,
} from "../lib/account-calculations";
import { formatCurrency } from "../lib/format-utils";
import {
  Item,
  ItemContent,
  ItemDescription,
} from "@workspace/ui/components/item";

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
    <Card size="sm">
      <CardHeader>
        <CardTitle>Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
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
      </CardContent>
    </Card>
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
    <Item variant="muted" size="xs" className="flex-col items-stretch">
      <ItemContent className="gap-1">
        <ItemDescription className="text-xs tracking-wider text-muted-foreground uppercase">
          {label}
        </ItemDescription>
        <span className="cn-font-heading text-lg tabular-nums">{value}</span>
        {subLabel && (
          <p className="text-xs text-muted-foreground">{subLabel}</p>
        )}
      </ItemContent>
    </Item>
  );
}

// function AllocationDonut({
//   accounts,
//   currency,
// }: {
//   accounts: Account[];
//   currency: string;
// }) {
//   const data = useMemo(() => {
//     const groupTotals = calculateGroupTotals(accounts).filter(
//       (g) => !g.isLiability && g.total > 0
//     );
//     return groupTotals.map((g) => ({
//       group: g.group,
//       label: ACCOUNT_GROUP_METADATA[g.group].label,
//       total: g.total,
//       fill: ACCOUNT_GROUP_METADATA[g.group].color,
//     }));
//   }, [accounts]);

//   const chartConfig = useMemo<ChartConfig>(() => {
//     const config: ChartConfig = {};
//     data.forEach((item) => {
//       config[item.label] = { label: item.label, color: item.fill };
//     });
//     return config;
//   }, [data]);

//   const totalAssets = data.reduce((sum, d) => sum + d.total, 0);

//   return (
//     <Card className="flex flex-1 flex-col gap-3 p-3">
//       <CardHeader className="p-0">
//         <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
//           Asset allocation
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="flex flex-1 flex-col p-0">
//         {data.length === 0 ? (
//           <p className="py-6 text-center text-xs text-muted-foreground">
//             No assets yet.
//           </p>
//         ) : (
//           <div className="grid flex-1 grid-cols-2 items-center gap-4">
//             <ChartContainer
//               config={chartConfig}
//               className="mx-auto aspect-square h-full max-h-40 min-h-28 w-full min-w-0"
//             >
//               <PieChart>
//                 <ChartTooltip
//                   content={<ChartTooltipContent nameKey="label" hideLabel />}
//                 />
//                 <Pie
//                   data={data}
//                   dataKey="total"
//                   nameKey="label"
//                   innerRadius={32}
//                   outerRadius={56}
//                   strokeWidth={2}
//                 />
//               </PieChart>
//             </ChartContainer>
//             <ul className="flex w-4/5 min-w-0 flex-col gap-1.5 text-xs">
//               {data.map((slice) => {
//                 const pct =
//                   totalAssets > 0
//                     ? Math.round((slice.total / totalAssets) * 100)
//                     : 0;
//                 return (
//                   <li key={slice.group} className="flex items-center gap-2">
//                     <span
//                       aria-hidden
//                       className="size-2 shrink-0 rounded-full"
//                       style={{ backgroundColor: slice.fill }}
//                     />
//                     <span className="flex-1 truncate text-foreground">
//                       {slice.label}
//                     </span>
//                     <span className="text-muted-foreground tabular-nums">
//                       {pct}%
//                     </span>
//                   </li>
//                 );
//               })}
//             </ul>
//           </div>
//         )}
//         {data.length > 0 && (
//           <p className="mt-3 text-xs text-muted-foreground">
//             Total assets:{" "}
//             <span className="text-foreground tabular-nums">
//               {formatCurrency(totalAssets, currency)}
//             </span>
//           </p>
//         )}
//       </CardContent>
//     </Card>
//   );
// }
