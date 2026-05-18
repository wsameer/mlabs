import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { formatCurrency } from "@/features/accounts/lib/format-utils";

type StageIndex = 0 | 1 | 2 | 3;

type HealthStage = {
  label: string;
  startPct: number;
  endPct: number;
  pillClassName: string;
  arcClassName: string;
};

const STAGES: readonly HealthStage[] = [
  {
    label: "Poor",
    startPct: 0,
    endPct: 20,
    pillClassName:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    arcClassName: "stroke-rose-500",
  },
  {
    label: "Decent",
    startPct: 20,
    endPct: 50,
    pillClassName:
      "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    arcClassName: "stroke-orange-500",
  },
  {
    label: "Good",
    startPct: 50,
    endPct: 80,
    pillClassName:
      "bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300",
    arcClassName: "stroke-lime-500",
  },
  {
    label: "Excellent",
    startPct: 80,
    endPct: 100,
    pillClassName:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    arcClassName: "stroke-emerald-500",
  },
] as const;

function getStageIndex(savingsRate: number): StageIndex {
  const pct = savingsRate * 100;
  if (pct < 20) return 0;
  if (pct < 50) return 1;
  if (pct < 80) return 2;
  return 3;
}

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
  const stageIndex = hasData ? getStageIndex(savingsRate) : 0;
  const stage = STAGES[stageIndex];

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Financial health</CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-3">
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
              <p className="font-heading text-3xl tracking-tight tabular-nums">
                {formatCurrency(savings, currency)}
              </p>
            </>
          )}

          <p className="pt-2 text-xs text-muted-foreground">
            Based on income and expenses for the selected period.
          </p>
        </div>

        <div className="flex items-center justify-center">
          <HealthGauge
            savingsPct={Math.round(savingsRate * 100)}
            stageIndex={stageIndex}
            disabled={!hasData || Boolean(isLoading)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function HealthGauge({
  savingsPct,
  stageIndex,
  disabled,
}: {
  savingsPct: number;
  stageIndex: StageIndex;
  disabled: boolean;
}) {
  // Three-quarter arc from 135° sweeping clockwise to 45° (270° total).
  // Each stage's arc length is proportional to its percentage range, so
  // Poor (0–20) is short, Decent/Good (30 each) are wider, Excellent (80–100) is short.
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 70;
  const strokeWidth = 12;
  const startAngle = 135;
  const totalSweep = 270;
  const gapDeg = 3;

  const pctToAngle = (pct: number) =>
    startAngle + (Math.min(100, Math.max(0, pct)) / 100) * totalSweep;

  const segments = STAGES.map((s, i) => {
    const segStart = pctToAngle(s.startPct) + (i === 0 ? 0 : gapDeg / 2);
    const segEnd = pctToAngle(s.endPct) - (i === STAGES.length - 1 ? 0 : gapDeg / 2);
    return {
      ...s,
      d: arcPath(cx, cy, r, segStart, segEnd),
      active: i <= stageIndex,
    };
  });

  const knob = polar(cx, cy, r, pctToAngle(savingsPct));

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="shrink-0"
      role="img"
      aria-label={
        disabled
          ? "Financial health gauge — no data"
          : `Financial health: ${savingsPct}% saved`
      }
    >
      {segments.map((seg, i) => (
        <path
          key={i}
          d={seg.d}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={disabled || !seg.active ? "stroke-muted" : seg.arcClassName}
        />
      ))}

      {!disabled && (
        <>
          <circle
            cx={knob.x}
            cy={knob.y}
            r={strokeWidth / 2 + 4}
            className="fill-background"
          />
          <circle
            cx={knob.x}
            cy={knob.y}
            r={strokeWidth / 2 + 1}
            className={STAGES[stageIndex].arcClassName.replace(
              "stroke-",
              "fill-"
            )}
          />
        </>
      )}

      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        className="fill-foreground font-heading text-[20px]"
      >
        {disabled ? "—" : `${savingsPct}%`}
      </text>
      <text
        x={cx}
        y={cy + 22}
        textAnchor="middle"
        className="fill-muted-foreground text-[9px]"
      >
        of income saved
      </text>
    </svg>
  );
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
) {
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}
