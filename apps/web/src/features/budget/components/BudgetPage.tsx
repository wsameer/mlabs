import { useLayoutConfig } from "@/features/layout/hooks/use-layout-config";

const FEATURE_IDEAS = [
  "Zero-based budgeting — assign every dollar a job (YNAB-style)",
  "Category groups (Bills, Lifestyle, Savings, Debt) with monthly limits",
  "Budget vs. actual tracking with progress bars per category",
  "Roll-over of unspent amounts to next month",
  "Overspending alerts and live remaining-to-budget figure",
  "Quick-budget actions: copy last month, average spent, underfunded",
  "Income assignment — distribute paycheck across categories",
  "Flexible budget periods (monthly, weekly, custom)",
  "Forecast view — project end-of-month balance based on pace",
];

export function BudgetPage() {
  useLayoutConfig({ pageTitle: "Budget" });

  return (
    <div className="mx-auto w-full max-w-2xl p-6 md:p-8">
      <h2 className="text-lg font-semibold">Coming soon</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Possible features for this section:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        {FEATURE_IDEAS.map((idea) => (
          <li key={idea}>{idea}</li>
        ))}
      </ul>
    </div>
  );
}
