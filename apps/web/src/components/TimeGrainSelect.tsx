import { useFiltersActions, useTimeGrain } from "@/hooks/use-filters";
import type { TimeGrain } from "@workspace/types";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

const GRAIN_OPTIONS: { label: string; value: TimeGrain }[] = [
  { label: "D", value: "daily" },
  { label: "W", value: "weekly" },
  { label: "M", value: "monthly" },
  { label: "Y", value: "yearly" },
  { label: "All", value: "all" },
];

export const TimeGrainSelect = () => {
  const timeGrain = useTimeGrain();
  const { setTimeGrain } = useFiltersActions();

  return (
    <Select
      items={GRAIN_OPTIONS}
      value={timeGrain}
      name="time-grain-selector"
      onValueChange={(v) => v && setTimeGrain(v)}
    >
      <SelectTrigger className="w-13.75 border-border bg-transparent" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {GRAIN_OPTIONS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
