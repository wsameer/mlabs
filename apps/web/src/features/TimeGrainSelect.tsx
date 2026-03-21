import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

type TimeGrain = "daily" | "weekly" | "monthly" | "yearly" | "ytd" | "all";

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
  { label: "YTD", value: "ytd" },
  { label: "All", value: "all" },
];

export const TimeGrainSelect = () => {
  return (
    <Select items={GRAIN_OPTIONS} defaultValue={GRAIN_OPTIONS[2]}>
      <SelectTrigger className="w-[65px]" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger>
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
