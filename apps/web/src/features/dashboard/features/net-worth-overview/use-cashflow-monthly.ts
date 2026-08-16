import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CashflowMonthlyResponse } from "@workspace/types";

export const cashflowMonthlyKeys = {
  all: ["cashflowMonthly"] as const,
};

export function useCashflowMonthly() {
  return useQuery({
    queryKey: cashflowMonthlyKeys.all,
    queryFn: ({ signal }) =>
      apiClient<CashflowMonthlyResponse>("/reports/cashflow-monthly", {
        signal,
      }),
  });
}
