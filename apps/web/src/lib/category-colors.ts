import type { CategoryTotal } from "@workspace/types";

const FALLBACK_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export type CategoryColorMap = Record<string, string>;

export function buildCategoryColorMap(
  items: CategoryTotal[]
): CategoryColorMap {
  const map: CategoryColorMap = {};
  items.forEach((item, i) => {
    const key = item.categoryId ?? "uncategorized";
    map[key] = item.categoryColor ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
  });
  return map;
}
