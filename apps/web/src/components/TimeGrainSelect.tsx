import type { TimeGrain } from "@workspace/types";

import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";

interface TimeGrainSelectProps {
  value?: TimeGrain;
  onValueChange: (value: TimeGrain) => void;
  className?: string;
}

const GRAIN_OPTIONS: { label: string; value: TimeGrain }[] = [
  { label: "D", value: "daily" },
  { label: "W", value: "weekly" },
  { label: "M", value: "monthly" },
  { label: "Y", value: "yearly" },
  { label: "All", value: "all" },
];

export const TimeGrainSelect = ({
  value,
  onValueChange,
  className,
}: TimeGrainSelectProps) => {
  return (
    <NativeSelect defaultValue={value ?? "monthly"}>
      <NativeSelectOptGroup label="Sales">
        {GRAIN_OPTIONS.map((item) => (
          <NativeSelectOption key={item.value} value={item.value}>
            {item.label}
          </NativeSelectOption>
        ))}
      </NativeSelectOptGroup>
    </NativeSelect>
  );
};
