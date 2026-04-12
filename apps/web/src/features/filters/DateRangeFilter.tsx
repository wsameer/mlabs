import { useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "lucide-react";
import {
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
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
import { ALL_DATA_START } from "@/constants";
import { Button } from "@workspace/ui/components/button";
import { Calendar } from "@workspace/ui/components/calendar";
import {
  getDisplayLabel,
  getNavigationBoundaries,
} from "@/lib/date-navigation";
import { nowInTz } from "@/lib/timezone";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, monthIndex) => ({
  label: format(new Date(2026, monthIndex, 1), "MMM"),
  value: monthIndex,
}));

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
        <div className="w-72 space-y-3 p-1">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setVisibleMonthYear((year) => year - 1)}
              disabled={visibleMonthYear <= getYear(ALL_DATA_START)}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <div className="text-sm font-medium">{visibleMonthYear}</div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setVisibleMonthYear((year) => year + 1)}
              disabled={visibleMonthYear >= getYear(today)}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {MONTH_OPTIONS.map((month) => {
              const monthDate = new Date(visibleMonthYear, month.value, 1);
              const disabled =
                monthDate < startOfMonth(ALL_DATA_START) ||
                monthDate > startOfMonth(today);
              const isSelected =
                getYear(from) === visibleMonthYear &&
                from.getMonth() === month.value;

              return (
                <Button
                  key={month.value}
                  variant={isSelected ? "default" : "ghost"}
                  className="h-10 rounded-md"
                  disabled={disabled}
                  onClick={() => handleMonthSelect(month.value)}
                >
                  {month.label}
                </Button>
              );
            })}
          </div>
        </div>
      );
    }

    if (timeGrain === "yearly") {
      return (
        <div className="w-48 p-1">
          <NativeSelect
            value={String(getYear(to))}
            onChange={(event) => handleYearSelect(event.target.value)}
            className="w-full"
          >
            {yearOptions.map((year) => (
              <NativeSelectOption key={year} value={String(year)}>
                {year}
              </NativeSelectOption>
            ))}
          </NativeSelect>
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
        <ChevronLeftIcon />
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
              {pickerEnabled && (
                <ChevronDownIcon className="size-4 opacity-60" />
              )}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
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
        <ChevronRightIcon />
      </Button>
    </div>
  );
};
