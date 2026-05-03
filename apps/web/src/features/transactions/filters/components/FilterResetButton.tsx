import { XIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

export interface FilterResetButtonProps {
  visible: boolean;
  onReset: () => void;
  className?: string;
}

export function FilterResetButton({
  visible,
  onReset,
  className,
}: FilterResetButtonProps) {
  if (!visible) return null;
  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={onReset}
      className={`${className ?? ""}`}
      data-testid="tx-filters-reset"
    >
      <XIcon className="size-3" />
      Reset
    </Button>
  );
}
