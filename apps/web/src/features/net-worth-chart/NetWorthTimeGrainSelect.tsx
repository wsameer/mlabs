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
  { label: "W", value: "weekly" },
  { label: "M", value: "monthly" },
  { label: "Y", value: "yearly" },
  { label: "All", value: "all" },
];

interface Props {
  value: TimeGrain;
  onChange: (grain: TimeGrain) => void;
}

export function NetWorthTimeGrainSelect({ value, onChange }: Props) {
  return (
    <Select
      items={GRAIN_OPTIONS}
      defaultValue={value}
      name="net-worth-time-grain"
      onValueChange={(v) => v && onChange(v)}
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
}
