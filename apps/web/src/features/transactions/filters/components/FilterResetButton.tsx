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
      variant="ghost"
      size="sm"
      onClick={onReset}
      className={`h-8 gap-1 text-xs text-muted-foreground ${className ?? ""}`}
    >
      <XIcon className="size-3" />
      Reset
    </Button>
  );
}
