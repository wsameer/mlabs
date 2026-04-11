import { ChevronDown, type LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { ItemGroup } from "@workspace/ui/components/item";

interface AccountGroupSectionProps {
  id: string;
  label: string;
  icon: LucideIcon;
  accountCount: number;
  total: number;
  currency?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function AccountGroupSection({
  id,
  label,
  icon: Icon,
  accountCount,
  total,
  currency = "CAD",
  defaultOpen = false,
  children,
}: AccountGroupSectionProps) {
  const formatted = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(total);

  return (
    <Collapsible
      id={id}
      defaultOpen={defaultOpen}
      className="rounded-md bg-muted"
    >
      <CollapsibleTrigger
        className="group flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left"
        aria-label={`${label}, ${accountCount} ${accountCount === 1 ? "account" : "accounts"}, total ${formatted}`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="shrink-0 rounded bg-muted p-1.5" aria-hidden="true">
            <Icon className="size-4 text-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">
              {accountCount} {accountCount === 1 ? "account" : "accounts"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground tabular-nums">
            {formatted}
          </span>
          <ChevronDown
            className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <ItemGroup className="p-2">{children}</ItemGroup>
      </CollapsibleContent>
    </Collapsible>
  );
}
