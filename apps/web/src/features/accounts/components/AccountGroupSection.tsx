import { type LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { Item, ItemContent } from "@workspace/ui/components/item";
import { Separator } from "@workspace/ui/components/separator";

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
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Collapsible defaultOpen={defaultOpen}>
      <Item
        size="xs"
        variant="outline"
        render={
          <ItemContent>
            <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between gap-3 px-2 py-1 text-left">
              <div className="flex min-w-0 items-center gap-2.5">
                {/* Group Icon */}
                <div className="shrink-0 rounded bg-muted p-1.5">
                  <Icon className="size-4 text-foreground" />
                </div>

                {/* Group Name */}
                <div className="min-w-0">
                  <h3 className="text-xs font-medium text-foreground">
                    {label}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {accountCount} {accountCount === 1 ? "account" : "accounts"}
                  </p>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs text-foreground tabular-nums">
                    {formatCurrency(total)}
                  </div>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="w-[95%]">
              <Separator className={"mb-2"} />
              {children}
            </CollapsibleContent>
          </ItemContent>
        }
      ></Item>
    </Collapsible>
  );
}
