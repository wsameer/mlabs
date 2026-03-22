import type { StateCreator } from "zustand";

import { getDefaultRange } from "@/lib/get-default-range";
import type { AppStoreState } from "@/lib/store/store";
import type { DateNavDirections, DateRange, TimeGrain } from "@workspace/types";
import { navigateDateRange } from "@/lib/date-navigation";
import { DEFAULT_GRAIN } from "@/constants";

export type FiltersSlice = {
  // State
  timeGrain: TimeGrain;
  dateRange: DateRange;

  // Actions
  setTimeGrain: (grain: TimeGrain) => void;
  setDateRange: (range: DateRange) => void;
  navigate: (direction: DateNavDirections) => void;
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

  navigate: (direction) =>
    set((state) => {
      const next = navigateDateRange({
        current: { from: state.dateRange.from, to: state.dateRange.to },
        grain: state.timeGrain,
        direction,
      });
      state.dateRange.from = next.from;
      state.dateRange.to = next.to;
    }),
});
