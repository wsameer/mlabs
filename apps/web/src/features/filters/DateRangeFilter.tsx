import { useCallback, useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  endOfDay,
  endOfMonth,
  endOfYear,
  getYear,
  startOfDay,
  startOfMonth,
  startOfYear,
} from "date-fns";

import {
  useDateRange,
  useFiltersActions,
  useTimeGrain,
} from "@/hooks/use-filters";
import { useTimezone } from "@/hooks/use-timezone";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Button } from "@workspace/ui/components/button";
import { Calendar } from "@workspace/ui/components/calendar";
import {
  getDisplayLabel,
  getNavigationBoundaries,
} from "@/lib/date-navigation";
import { nowInTz } from "@/lib/timezone";

import { ALL_DATA_START } from "@/constants";
import { MonthPicker } from "./components/MonthPicker";

const isPickerEnabled = (timeGrain: ReturnType<typeof useTimeGrain>) =>
  timeGrain === "daily" || timeGrain === "monthly" || timeGrain === "yearly";

export const DateRangeFilter = () => {
  const timeGrain = useTimeGrain();
  const { to, from } = useDateRange();
  const { navigate, setDateRange } = useFiltersActions();
  const tz = useTimezone();
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonthYear, setVisibleMonthYear] = useState(getYear(to));
  const today = nowInTz(tz);
  const pickerEnabled = isPickerEnabled(timeGrain);
  const { prevDisabled, nextDisabled } = getNavigationBoundaries(
    { from, to },
    timeGrain,
    tz
  );
  const yearOptions = useMemo(() => {
    const startYear = getYear(ALL_DATA_START);
    const currentYear = getYear(today);

    return Array.from(
      { length: currentYear - startYear + 1 },
      (_, index) => currentYear - index
    );
  }, [today]);

  const applyRange = (nextRange: { from: Date; to: Date }) => {
    setDateRange(nextRange);
    setIsOpen(false);
  };

  const handleDaySelect = (date?: Date) => {
    if (!date) return;

    applyRange({
      from: startOfDay(date),
      to: date > today ? today : endOfDay(date),
    });
  };

  const handleMonthSelect = (month: number) => {
    const anchor = new Date(visibleMonthYear, month, 1);
    applyRange({
      from: startOfMonth(anchor),
      to: endOfMonth(anchor) > today ? today : endOfMonth(anchor),
    });
  };

  const handleYearSelect = (value: string | null) => {
    if (!value) return;

    const selectedYear = Number(value);
    const anchor = new Date(selectedYear, 0, 1);

    applyRange({
      from: startOfYear(anchor),
      to: endOfYear(anchor) > today ? today : endOfYear(anchor),
    });
  };

  const getVariant = useCallback(
    (year: number) => {
      if (new Date().getFullYear() === year) {
        return "secondary";
      }

      if (getYear(to) === year) {
        return "default";
      }

      return "ghost";
    },
    [to]
  );

  const renderPickerContent = () => {
    if (timeGrain === "daily") {
      return (
        <Calendar
          mode="single"
          selected={to}
          month={to}
          onSelect={handleDaySelect}
          disabled={{ before: ALL_DATA_START, after: today }}
        />
      );
    }

    if (timeGrain === "monthly") {
      return (
        <MonthPicker
          visibleMonthYear={visibleMonthYear}
          setVisibleMonthYear={setVisibleMonthYear}
          handleMonthSelect={handleMonthSelect}
        />
      );
    }

    if (timeGrain === "yearly") {
      return (
        <div className="w-48 p-1">
          {yearOptions.map((year) => (
            <Button
              variant={getVariant(year)}
              key={year}
              onClick={() => handleYearSelect(String(year))}
            >
              {year}
            </Button>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex content-center items-center justify-between">
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous date range"
        disabled={prevDisabled}
        onClick={() => navigate("prev")}
      >
        <ChevronLeftIcon className="size-4" />
      </Button>

      <Popover
        open={pickerEnabled ? isOpen : false}
        onOpenChange={(open) => {
          if (!pickerEnabled) return;
          setVisibleMonthYear(getYear(to));
          setIsOpen(open);
        }}
      >
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              id="global-date-filter-picker"
              className="justify-start font-normal"
              disabled={!pickerEnabled}
            >
              {getDisplayLabel(timeGrain, { from, to })}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="center">
          {renderPickerContent()}
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        aria-label="Next date range"
        disabled={nextDisabled}
        onClick={() => navigate("next")}
      >
        <ChevronRightIcon className="size-4" />
      </Button>
    </div>
  );
};
