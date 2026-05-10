import { useLayoutConfig } from "@/features/layout/hooks/use-layout-config";

const FEATURE_IDEAS = [
  "Goal types: emergency fund, savings, debt payoff, large purchase, retirement",
  "Target amount + target date with required monthly contribution math",
  "Link goals to specific accounts so progress updates automatically",
  "Progress bars and time-remaining estimates",
  "Multiple concurrent goals with priority ordering",
  "Auto-allocation rules — split surplus cashflow across goals",
  "Milestone celebrations at 25 / 50 / 75 / 100%",
  "Goal feasibility check based on current savings rate",
  "Pause / archive completed goals without losing history",
];

export function GoalsPage() {
  useLayoutConfig({ pageTitle: "Goals" });

  return (
    <div className="mx-auto w-full max-w-2xl p-6 md:p-8">
      <h2 className="text-lg font-semibold">Coming soon</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Possible features for this section:
      </p>
      <ul className="text-muted-foreground mt-4 list-disc space-y-2 pl-5 text-sm">
        {FEATURE_IDEAS.map((idea) => (
          <li key={idea}>{idea}</li>
        ))}
      </ul>
    </div>
  );
}
