import { useShallow } from "zustand/shallow";

import { useAppStore } from "@/stores/app-store";
import {
  globalDateRangeSelector,
  globalTimeGrainSelector,
} from "@/stores/selectors/filters-selectors";

export const useTimeGrain = () => useAppStore(globalTimeGrainSelector);
export const useDateRange = () => useAppStore(globalDateRangeSelector);

export const useFiltersActions = () =>
  useAppStore(
    useShallow((state) => ({
      setTimeGrain: state.setTimeGrain,
      setDateRange: state.setDateRange,
      navigate: state.navigate,
    }))
  );
