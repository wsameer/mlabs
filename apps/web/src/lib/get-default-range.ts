import { ALL_DATA_START } from "@/constants";
import type { DateRange, TimeGrain } from "@workspace/types";
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";

export function getDefaultRange(grain: TimeGrain): DateRange {
  const now = new Date();

  switch (grain) {
    case "daily":
      return { from: startOfDay(now), to: now };
    case "weekly":
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: now };
    case "monthly":
      return { from: startOfMonth(now), to: now };
    case "yearly":
      return { from: startOfYear(now), to: now };
    case "all":
      return { from: ALL_DATA_START, to: now };
  }
}
