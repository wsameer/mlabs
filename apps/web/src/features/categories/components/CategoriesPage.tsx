import { useLayoutConfig } from "@/features/layout/hooks/use-layout-config";

const FEATURE_IDEAS = [
  "Manage category tree — groups, categories, subcategories",
  "Custom icons + colors per category for instant recognition",
  "Merge categories and bulk-recategorize past transactions",
  "Rename / archive without losing historical data",
  "Auto-categorization rules based on merchant, memo, or amount",
  "Per-category visibility toggle — hide from dashboards but keep history",
  "Category-level monthly average and 12-month trend",
  "Income vs. expense vs. transfer classification",
  "System defaults + ability to reset to a sensible starter taxonomy",
  "Search and filter — quickly find rarely-used categories",
];

export function CategoriesPage() {
  useLayoutConfig({ pageTitle: "Categories" });

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
