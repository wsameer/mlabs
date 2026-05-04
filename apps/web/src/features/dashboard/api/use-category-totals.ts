import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CategoryTotalsResponse } from "@workspace/types";

type CategoryTotalsParams = {
  startDate: string;
  endDate: string;
  type: "INCOME" | "EXPENSE";
  accountId?: string;
};

export const categoryTotalsKeys = {
  all: ["categoryTotals"] as const,
  list: (params: CategoryTotalsParams) =>
    [...categoryTotalsKeys.all, params] as const,
};

export function useCategoryTotals(params: CategoryTotalsParams) {
  return useQuery({
    queryKey: categoryTotalsKeys.list(params),
    queryFn: ({ signal }) =>
      apiClient<CategoryTotalsResponse>("/reports/category-totals", {
        params,
        signal,
      }),
  });
}
