import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { formatCurrency } from "@/features/accounts/lib/format-utils";
import { HealthGauge } from "./HealthGauge";
import { STAGES, getStageIndex } from "./health-stages";

interface FinancialHealthCardProps {
  income: number | null;
  expenses: number | null;
  currency: string;
  isLoading?: boolean;
}

export function FinancialHealthCard({
  income,
  expenses,
  currency,
  isLoading,
}: FinancialHealthCardProps) {
  const hasData = income !== null && expenses !== null && income > 0;
  const savings = hasData ? income - expenses : 0;
  const savingsRate = hasData ? Math.max(0, savings / income) : 0;
  const savingsPct = Math.round(savingsRate * 100);
  const stageIndex = hasData ? getStageIndex(savingsRate) : 0;
  const stage = STAGES[stageIndex];
  const showGauge = hasData && !isLoading;

  return (
    <Card className="@container relative min-h-56 min-w-[18rem] flex-1 py-0 pt-4">
      <CardHeader>
        <CardTitle>Financial health</CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 flex h-full flex-col gap-2 @[400px]:max-w-[55%]">
        {isLoading || !hasData ? (
          <>
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-9 w-40" />
          </>
        ) : (
          <>
            <span
              className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${stage.pillClassName}`}
            >
              {stage.label}
            </span>
            <p className="font-heading text-3xl tracking-normal tabular-nums">
              {formatCurrency(savings, currency)}
            </p>
          </>
        )}
        <p className="mt-auto pt-4 text-xs text-muted-foreground">
          Based on income and expenses for the selected period.
        </p>
      </CardContent>

      <div className="hidden @[400px]:block">
        <HealthGauge
          savingsPct={savingsPct}
          stageIndex={stageIndex}
          disabled={!showGauge}
        />

        {showGauge && (
          <div className="pointer-events-none absolute right-10 bottom-18 z-10 text-center">
            <p className="font-heading text-2xl tabular-nums">{savingsPct}%</p>
            <p className="text-xs text-muted-foreground">Of income saved</p>
          </div>
        )}
      </div>

      {showGauge && (
        <p className="px-4 text-xs text-muted-foreground @[400px]:hidden">
          {savingsPct}% of income saved
        </p>
      )}
    </Card>
  );
}
