import { ALL_DATA_START } from "@/constants";
import type { DateNavDirections, DateRange, TimeGrain } from "@workspace/types";
import {
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  addYears,
  subYears,
  startOfYear,
  endOfYear,
  isAfter,
  min,
  max,
  format,
  getYear,
  isToday,
} from "date-fns";

type NavigateOptions = {
  current: DateRange;
  grain: TimeGrain;
  direction: DateNavDirections;
};

export function navigateDateRange({
  current,
  grain,
  direction,
}: NavigateOptions): DateRange {
  const today = new Date();
  const isPrev = direction === "prev";

  switch (grain) {
    case "daily": {
      const next = isPrev ? subDays(current.from, 1) : addDays(current.from, 1);
      const clamped = isPrev
        ? max([next, ALL_DATA_START]) // clamp past
        : min([next, today]); // clamp future
      return { from: clamped, to: clamped };
    }

    case "weekly": {
      const anchor = isPrev
        ? subWeeks(current.from, 1)
        : addWeeks(current.from, 1);
      const from = startOfWeek(anchor, { weekStartsOn: 1 });
      const to = endOfWeek(anchor, { weekStartsOn: 1 });
      return {
        from: max([from, ALL_DATA_START]),
        to: min([to, today]),
      };
    }

    case "monthly": {
      const anchor = isPrev
        ? subMonths(current.from, 1)
        : addMonths(current.from, 1);
      const from = startOfMonth(anchor);
      const to = endOfMonth(anchor);
      return {
        from: max([from, ALL_DATA_START]),
        to: min([to, today]),
      };
    }

    case "yearly": {
      const anchor = isPrev
        ? subYears(current.from, 1)
        : addYears(current.from, 1);
      const from = startOfYear(anchor);
      const to = endOfYear(anchor);
      return {
        from: max([from, ALL_DATA_START]),
        to: min([to, today]),
      };
    }

    case "all":
      return current; // no-op, buttons are disabled anyway
  }
}

// Used to disable buttons — derived, not stored
export function getNavigationBoundaries(current: DateRange, grain: TimeGrain) {
  if (grain === "all") return { prevDisabled: true, nextDisabled: true };

  const today = new Date();

  const prevDisabled = !isAfter(current.from, ALL_DATA_START);
  const nextDisabled = isToday(current.to) || isAfter(current.to, today);

  return { prevDisabled, nextDisabled };
}

export function getDisplayLabel(tg: TimeGrain, current: DateRange) {
  switch (tg) {
    case "all":
      return "All time";

    case "daily":
      return format(current.to, "PPP");

    case "monthly":
      return format(current.to, "MMMM yyyy");

    case "yearly":
      return getYear(current.to);

    case "weekly":
      return `${format(current.from, "PP")} to ${format(current.to, "PP")}`;

    default:
      return "Error";
  }
}
