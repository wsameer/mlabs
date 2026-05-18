import { Card } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";

export function KpiCard({
  label,
  value,
  subLabel,
  isLoading,
  valueClassName,
}: {
  label: string;
  value: string | null;
  subLabel?: string;
  isLoading?: boolean;
  valueClassName?: string;
}) {
  return (
    <Card className="gap-1 p-3">
      <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      {isLoading || value === null ? (
        <Skeleton className="h-6 w-20" />
      ) : (
        <p
          className={`text-lg leading-tight tabular-nums ${
            valueClassName ?? "text-foreground"
          }`}
        >
          {value}
        </p>
      )}
      {subLabel && (
        <p className="truncate text-xs text-muted-foreground">{subLabel}</p>
      )}
    </Card>
  );
}
