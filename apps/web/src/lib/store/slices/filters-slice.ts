import type { StateCreator } from "zustand";

import { getDefaultRange } from "@/lib/get-default-range";
import type { AppStoreState } from "@/lib/store/store";
import type { DateRange, TimeGrain } from "@workspace/types";

const DEFAULT_GRAIN: TimeGrain = "monthly";

export type FiltersSlice = {
  // State
  timeGrain: TimeGrain;
  dateRange: DateRange;

  // Actions
  setTimeGrain: (grain: TimeGrain) => void;
  setDateRange: (range: DateRange) => void;
};

export const createFiltersSlice: StateCreator<
  AppStoreState,
  [["zustand/immer", never]],
  [],
  FiltersSlice
> = (set) => ({
  timeGrain: DEFAULT_GRAIN,
  dateRange: getDefaultRange(DEFAULT_GRAIN),

  setTimeGrain: (grain) =>
    set((state) => {
      state.timeGrain = grain;
      state.dateRange = getDefaultRange(grain);
    }),

  setDateRange: (range) => set((state) => (state.dateRange = range)),
});
