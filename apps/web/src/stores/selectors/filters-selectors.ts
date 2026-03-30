import { type AppStoreState } from "@/stores/app-store";

export const globalTimeGrainSelector = (state: AppStoreState) =>
  state.timeGrain;
export const globalDateRangeSelector = (state: AppStoreState) =>
  state.dateRange;
