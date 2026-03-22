import { type AppStoreState } from "@/lib/store/store";

export const globalTimeGrainSelector = (state: AppStoreState) =>
  state.timeGrain;
export const globalDateRangeSelector = (state: AppStoreState) =>
  state.dateRange;
