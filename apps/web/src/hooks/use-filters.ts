import { useAppStore } from "@/lib/store";

export function useFilters() {
  const { timeGrain, dateRange, setTimeGrain, setDateRange } = useAppStore();
  return { timeGrain, dateRange, setTimeGrain, setDateRange };
}
