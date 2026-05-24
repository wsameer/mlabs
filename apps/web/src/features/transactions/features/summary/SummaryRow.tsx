import { formatCurrency } from "@/features/accounts/lib/format-utils";
import { cn } from "@workspace/ui/lib/utils";

export function SummaryRow({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: "income" | "expense" | "net";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-xs font-medium tabular-nums",
          variant === "income" && "text-emerald-600 dark:text-emerald-400",
          variant === "expense" && "text-red-600 dark:text-red-400",
          variant === "net" && value >= 0
            ? "text-emerald-600 dark:text-emerald-400"
            : variant === "net" && "text-red-600 dark:text-red-400"
        )}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}
