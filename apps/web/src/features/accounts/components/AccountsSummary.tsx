import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { cn } from "@workspace/ui/lib/utils";
import type { AccountGroup } from "@workspace/types";

interface AccountsSummaryData {
  assets: {
    total: number;
    groups: Array<{
      group: AccountGroup;
      label: string;
      amount: number;
      color: string;
    }>;
  };
  liabilities: {
    total: number;
    groups: Array<{
      group: AccountGroup;
      label: string;
      amount: number;
      color: string;
    }>;
  };
  currency?: string;
}

interface AccountsSummaryProps {
  data: AccountsSummaryData;
}

export function AccountsSummary({ data }: AccountsSummaryProps) {
  const currency = data.currency ?? "CAD";
  const netWorth = data.assets.total - data.liabilities.total;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const calculatePercentage = (amount: number, total: number) => {
    if (total === 0) return 0;
    return (amount / total) * 100;
  };

  return (
    <div className="rounded-lg border bg-card">
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-b-none">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="totals">Totals</TabsTrigger>
          <TabsTrigger value="percent">Percent</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6 p-6">
          {/* Assets */}
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-foreground">Assets</h3>
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(data.assets.total)}
              </span>
            </div>
            <div className="space-y-2">
              {data.assets.groups.map((group) => (
                <div key={group.group} className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-sm"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="text-muted-foreground">{group.label}</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {formatCurrency(group.amount)}
                  </span>
                </div>
              ))}
            </div>

            {/* Assets Bar */}
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="flex h-full">
                {data.assets.groups.map((group) => {
                  const percentage = calculatePercentage(group.amount, data.assets.total);
                  if (percentage === 0) return null;
                  return (
                    <div
                      key={group.group}
                      className="h-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: group.color,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Liabilities */}
          {data.liabilities.total > 0 && (
            <div>
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="text-sm font-semibold text-foreground">Liabilities</h3>
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(data.liabilities.total)}
                </span>
              </div>
              <div className="space-y-2">
                {data.liabilities.groups.map((group) => (
                  <div key={group.group} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="size-3 rounded-sm"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="text-muted-foreground">{group.label}</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {formatCurrency(group.amount)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Liabilities Bar */}
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="flex h-full">
                  {data.liabilities.groups.map((group) => {
                    const percentage = calculatePercentage(group.amount, data.liabilities.total);
                    if (percentage === 0) return null;
                    return (
                      <div
                        key={group.group}
                        className="h-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: group.color,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="totals" className="space-y-4 p-6">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total Assets</span>
              <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(data.assets.total)}
              </span>
            </div>
            {data.liabilities.total > 0 && (
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Total Liabilities</span>
                <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(data.liabilities.total)}
                </span>
              </div>
            )}
            <div className="border-t pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-foreground">Net Worth</span>
                <span className="text-xl font-bold text-foreground">
                  {formatCurrency(netWorth)}
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="percent" className="space-y-6 p-6">
          {/* Assets Percentages */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Assets</h3>
            <div className="space-y-2">
              {data.assets.groups.map((group) => {
                const percentage = calculatePercentage(group.amount, data.assets.total);
                return (
                  <div key={group.group}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="size-3 rounded-sm"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="text-muted-foreground">{group.label}</span>
                      </div>
                      <span className="font-medium text-foreground">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: group.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Liabilities Percentages */}
          {data.liabilities.total > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Liabilities</h3>
              <div className="space-y-2">
                {data.liabilities.groups.map((group) => {
                  const percentage = calculatePercentage(group.amount, data.liabilities.total);
                  return (
                    <div key={group.group}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="size-3 rounded-sm"
                            style={{ backgroundColor: group.color }}
                          />
                          <span className="text-muted-foreground">{group.label}</span>
                        </div>
                        <span className="font-medium text-foreground">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: group.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
