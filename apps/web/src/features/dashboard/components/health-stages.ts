export type StageIndex = 0 | 1 | 2 | 3;

export type HealthStage = {
  label: string;
  startPct: number;
  endPct: number;
  pillClassName: string;
  arcClassName: string;
};

export const STAGES: readonly HealthStage[] = [
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

export function getStageIndex(savingsRate: number): StageIndex {
  const pct = savingsRate * 100;
  if (pct < 20) return 0;
  if (pct < 50) return 1;
  if (pct < 80) return 2;
  return 3;
}
