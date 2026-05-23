import { formatCurrency } from "@/features/accounts/lib/format-utils";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { HealthGauge } from "./HealthGauge";
import {
  STAGES,
  getStageIndex,
  type HealthStage,
  type StageIndex,
} from "./health-stages";

interface FinancialHealthCardProps {
  income: number | null;
  expenses: number | null;
  currency: string;
  isLoading?: boolean;
}

type FinancialHealthState =
  | { kind: "loading" }
  | { kind: "empty" }
  | {
      kind: "ready";
      savings: number;
      savingsPct: number;
      stageIndex: StageIndex;
      stage: HealthStage;
    };

export function FinancialHealthCard({
  income,
  expenses,
  currency,
  isLoading = false,
}: FinancialHealthCardProps) {
  const state = getFinancialHealthState({ income, expenses, isLoading });

  return (
    <Card className="@container relative min-h-56 min-w-[18rem] flex-1 overflow-hidden py-0 pt-4">
      <CardHeader>
        <CardTitle>Financial health</CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 flex h-full flex-col gap-3 @[350px]:max-w-[55%]">
        <FinancialHealthBody state={state} currency={currency} />

        <p className="mt-auto pt-4 text-xs text-muted-foreground">
          Based on income and expenses for the selected period.
        </p>
      </CardContent>

      <FinancialHealthVisual state={state} />
    </Card>
  );
}

function getFinancialHealthState({
  income,
  expenses,
  isLoading,
}: Pick<
  FinancialHealthCardProps,
  "income" | "expenses" | "isLoading"
>): FinancialHealthState {
  if (isLoading) {
    return { kind: "loading" };
  }

  const hasData = income !== null && expenses !== null && income > 0;
  if (!hasData) {
    return { kind: "empty" };
  }

  const savings = income - expenses;
  const savingsRate = Math.max(0, savings / income);
  const savingsPct = Math.round(savingsRate * 100);
  const stageIndex = getStageIndex(savingsRate);

  return {
    kind: "ready",
    savings,
    savingsPct,
    stageIndex,
    stage: STAGES[stageIndex],
  };
}

function FinancialHealthBody({
  state,
  currency,
}: {
  state: FinancialHealthState;
  currency: string;
}) {
  if (state.kind === "loading") {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-4 w-28 @[350px]:hidden" />
      </div>
    );
  }

  if (state.kind === "empty") {
    return (
      <div className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit">
          No data
        </Badge>
        <p className="font-heading text-xl tracking-tight text-foreground">
          No data available
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Badge className={`w-fit ${state.stage.pillClassName}`}>
        {state.stage.label}
      </Badge>
      <p className="font-heading text-2xl tracking-tight tabular-nums">
        {formatCurrency(state.savings, currency)}
      </p>
    </div>
  );
}

function FinancialHealthVisual({ state }: { state: FinancialHealthState }) {
  if (state.kind === "loading") {
    return (
      <div className="hidden @[350px]:block">
        <div className="absolute -right-14.5 -bottom-14.5">
          <Skeleton className="size-65 rounded-full" />
        </div>
        <div className="pointer-events-none absolute right-10 bottom-18 z-10 text-center">
          <Skeleton className="mx-auto h-7 w-16" />
          <Skeleton className="mx-auto mt-2 h-3 w-24" />
        </div>
      </div>
    );
  }

  const showGaugeLabel = state.kind === "ready";

  return (
    <>
      <div className="hidden @[350px]:block">
        <HealthGauge
          savingsPct={showGaugeLabel ? state.savingsPct : 0}
          stageIndex={showGaugeLabel ? state.stageIndex : 0}
          disabled={!showGaugeLabel}
        />

        {showGaugeLabel ? (
          <div className="pointer-events-none absolute right-10 bottom-18 z-10 text-center">
            <p className="font-heading text-2xl tabular-nums">
              {state.savingsPct}%
            </p>
            <p className="text-xs text-muted-foreground">Of income saved</p>
          </div>
        ) : null}
      </div>

      {showGaugeLabel ? (
        <p className="px-4 text-xs text-muted-foreground @[350px]:hidden">
          {state.savingsPct}% of income saved
        </p>
      ) : null}
    </>
  );
}
