import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import {
  useDateRange,
  useFiltersActions,
  useTimeGrain,
} from "@/hooks/use-filters";
import { Button } from "@workspace/ui/components/button";
import {
  getDisplayLabel,
  getNavigationBoundaries,
} from "@/lib/date-navigation";

export const DateRangeFilter = () => {
  const timeGrain = useTimeGrain();
  const { to, from } = useDateRange();
  const { navigate } = useFiltersActions();
  const { prevDisabled, nextDisabled } = getNavigationBoundaries(
    { from, to },
    timeGrain
  );

  return (
    <div className="flex content-center items-center justify-between">
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous date range"
        disabled={prevDisabled}
        onClick={() => navigate("prev")}
      >
        <ChevronLeftIcon />
      </Button>
      <p className="text-sm">
        {getDisplayLabel(timeGrain, { from, to })}
      </p>
      <Button
        variant="outline"
        size="icon"
        aria-label="Next date range"
        disabled={nextDisabled}
        onClick={() => navigate("next")}
      >
        <ChevronRightIcon />
      </Button>
    </div>
  );
};
