import { useEffect, useState } from "react";
import { Input } from "@workspace/ui/components/input";

export interface AmountRangeInputsProps {
  min: number | undefined;
  max: number | undefined;
  onCommit: (next: { min: number | undefined; max: number | undefined }) => void;
  className?: string;
}

function parseOptionalNumber(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

export function AmountRangeInputs({
  min,
  max,
  onCommit,
  className,
}: AmountRangeInputsProps) {
  const [minLocal, setMinLocal] = useState(min !== undefined ? String(min) : "");
  const [maxLocal, setMaxLocal] = useState(max !== undefined ? String(max) : "");

  useEffect(() => {
    setMinLocal(min !== undefined ? String(min) : "");
  }, [min]);
  useEffect(() => {
    setMaxLocal(max !== undefined ? String(max) : "");
  }, [max]);

  const commit = () => {
    onCommit({
      min: parseOptionalNumber(minLocal),
      max: parseOptionalNumber(maxLocal),
    });
  };

  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        value={minLocal}
        onChange={(e) => setMinLocal(e.target.value)}
        onBlur={commit}
        placeholder="Min $"
        aria-label="Minimum amount"
        className="h-8 w-20 text-xs"
      />
      <span className="text-xs text-muted-foreground">–</span>
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        value={maxLocal}
        onChange={(e) => setMaxLocal(e.target.value)}
        onBlur={commit}
        placeholder="Max $"
        aria-label="Maximum amount"
        className="h-8 w-20 text-xs"
      />
    </div>
  );
}
