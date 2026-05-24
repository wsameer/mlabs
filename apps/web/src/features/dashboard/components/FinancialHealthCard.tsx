import { formatCurrency } from "@/features/accounts/lib/format-utils";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
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
  disclaimer?: string;
  density?: "default" | "compact";
  className?: string;
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
  density,
}: {
  state: FinancialHealthState;
  currency: string;
  density: FinancialHealthCardProps["density"];
}) {
  if (state.kind === "loading") {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-4 w-28 @[300px]:hidden" />
      </div>
    );
  }

  if (state.kind === "empty") {
    return (
      <div className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit">
          No data
        </Badge>
        <p
          className={cn(
            "font-heading tracking-tight text-foreground",
            density === "compact" ? "text-lg" : "text-xl"
          )}
        >
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
      <p
        className={cn(
          "font-heading tracking-tight tabular-nums",
          density === "compact" ? "text-xl" : "text-2xl"
        )}
      >
        {formatCurrency(state.savings, currency)}
      </p>
    </div>
  );
}

function FinancialHealthVisual({ state }: { state: FinancialHealthState }) {
  if (state.kind === "loading") {
    return (
      <div className="hidden @[300px]:block">
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
      <div className="hidden @[300px]:block">
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
        <p className="px-3 text-xs text-muted-foreground @[300px]:hidden @[300px]:px-4">
          {state.savingsPct}% of income saved
        </p>
      ) : null}
    </>
  );
}

export function FinancialHealthCard({
  income,
  expenses,
  currency,
  isLoading = false,
  disclaimer,
  density = "default",
  className,
}: FinancialHealthCardProps) {
  const state = getFinancialHealthState({ income, expenses, isLoading });
  const isCompact = density === "compact";

  return (
    <Card
      size="sm"
      className={cn(
        "@container relative min-w-[18rem] flex-1 overflow-hidden py-0",
        isCompact ? "min-h-36 min-w-0 pt-3" : "min-h-56 pt-4",
        className
      )}
    >
      <CardHeader className={isCompact ? "px-3" : undefined}>
        <CardTitle>Financial health</CardTitle>
      </CardHeader>

      <CardContent
        className={cn(
          "relative z-10 flex h-full flex-col gap-3",
          isCompact ? "px-3" : "@[300px]:max-w-[40%]"
        )}
      >
        <FinancialHealthBody
          state={state}
          currency={currency}
          density={density}
        />
      </CardContent>

      {isCompact ? null : <FinancialHealthVisual state={state} />}

      <CardFooter className="mt-auto w-2/5 text-xs text-muted-foreground">
        {disclaimer ?? `Based on income and expenses for the selected period.`}
      </CardFooter>
    </Card>
  );
}
