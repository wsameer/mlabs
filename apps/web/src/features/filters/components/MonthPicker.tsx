import { ALL_DATA_START } from "@/constants";
import { useDateRange } from "@/hooks/use-filters";
import { useTimezone } from "@/hooks/use-timezone";
import { nowInTz } from "@/lib/timezone";
import { Button } from "@workspace/ui/components/button";
import { format, getYear, startOfMonth } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, monthIndex) => ({
  label: format(new Date(2026, monthIndex, 1), "MMM"),
  value: monthIndex,
}));

type Props = {
  visibleMonthYear: number;
  handleMonthSelect: (month: number) => void;
  setVisibleMonthYear: React.Dispatch<React.SetStateAction<number>>;
};

export function MonthPicker({
  handleMonthSelect,
  visibleMonthYear,
  setVisibleMonthYear,
}: Props) {
  const { from } = useDateRange();
  const tz = useTimezone();
  const today = nowInTz(tz);

  return (
    <div className="w-40 p-1">
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

      <div className="grid grid-cols-3 gap-1">
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
              className="h-8"
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
