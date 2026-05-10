import { useLayoutConfig } from "@/features/layout/hooks/use-layout-config";

const FEATURE_IDEAS = [
  "Headline net worth — assets minus liabilities, updated live",
  "Trend chart with monthly / quarterly / yearly grain (Monarch-style)",
  "Breakdown by account type: cash, investments, real estate, debt",
  "Add manual assets (property, vehicles, collectibles) and liabilities (loans)",
  "Period-over-period change — month, quarter, year, all-time",
  "Asset allocation donut: liquid vs. invested vs. real assets",
  "Milestones — first $10k, $100k, debt-free, FI number",
  "Snapshots — capture and label net worth at key moments",
  "Projection model based on current savings rate",
  "Compare against goals (e.g., FIRE target, retirement number)",
];

export function NetWorthPage() {
  useLayoutConfig({ pageTitle: "Net Worth" });

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
