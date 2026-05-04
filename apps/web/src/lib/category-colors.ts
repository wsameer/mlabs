import type { CategoryTotal } from "@workspace/types";

const CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

export type CategoryColorMap = Record<string, string>;

export function buildCategoryColorMap(
  items: CategoryTotal[]
): CategoryColorMap {
  const map: CategoryColorMap = {};
  items.forEach((item, i) => {
    const key = item.categoryId ?? "uncategorized";
    map[key] = CHART_PALETTE[i % CHART_PALETTE.length]!;
  });
  return map;
}
