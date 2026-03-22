import React from "react";
import type { DateRange, TimeGrain } from "@workspace/types";
import { getDefaultRange } from "@/lib/get-default-range";

import { useFilters } from "./use-filters";

// hooks for pages that need their own grain/range
export function useLocalFilters(
  overrides?: Partial<{ timeGrain: TimeGrain; dateRange: DateRange }>
) {
  const global = useFilters();

  const [localGrain, setLocalGrain] = React.useState<TimeGrain>(
    overrides?.timeGrain ?? global.timeGrain
  );
  const [localRange, setLocalRange] = React.useState<DateRange>(
    overrides?.dateRange ?? global.dateRange
  );

  const setLocalTimeGrain = React.useCallback((grain: TimeGrain) => {
    setLocalGrain(grain);
    setLocalRange(getDefaultRange(grain));
  }, []);

  return {
    timeGrain: localGrain,
    dateRange: localRange,
    setTimeGrain: setLocalTimeGrain,
    setDateRange: setLocalRange,
  };
}
