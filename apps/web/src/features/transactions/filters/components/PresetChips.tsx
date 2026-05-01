import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import type { TransactionFilterPreset } from "../filter-types";

const PRESETS: Array<{ value: TransactionFilterPreset; label: string }> = [
  { value: "all", label: "All" },
  { value: "uncategorized", label: "Uncategorized" },
  { value: "income", label: "Income" },
  { value: "expenses", label: "Expenses" },
];

export interface PresetChipsProps {
  value: TransactionFilterPreset;
  onChange: (next: TransactionFilterPreset) => void;
  disabled?: boolean;
}

export function PresetChips({ value, onChange, disabled }: PresetChipsProps) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next) => {
        if (!next.length) return;
        onChange(next[0] as TransactionFilterPreset);
      }}
      disabled={disabled}
      className="flex flex-wrap gap-1"
    >
      {PRESETS.map((p) => (
        <ToggleGroupItem key={p.value} value={p.value} className="text-xs">
          {p.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
