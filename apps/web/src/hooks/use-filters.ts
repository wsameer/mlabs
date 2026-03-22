import { useShallow } from "zustand/shallow";

import { useAppStore } from "@/lib/store/store";
import {
  globalDateRangeSelector,
  globalTimeGrainSelector,
} from "@/lib/store/selectors/filters-selectors";

export const useTimeGrain = () => useAppStore(globalTimeGrainSelector);
export const useDateRange = () => useAppStore(globalDateRangeSelector);

export const useFiltersActions = () =>
  useAppStore(
    useShallow((state) => ({
      setTimeGrain: state.setTimeGrain,
      setDateRange: state.setDateRange,
    }))
  );
