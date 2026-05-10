import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronRightIcon, MoreVerticalIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

interface CollapsibleGroupProps {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
  meta?: ReactNode;
  defaultOpen?: boolean;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function CollapsibleGroup({
  id,
  label,
  icon: Icon,
  count,
  meta,
  defaultOpen = false,
  actions,
  children,
  className,
}: CollapsibleGroupProps) {
  return (
    <Collapsible
      id={id}
      defaultOpen={defaultOpen}
      className={cn("group/cgroup w-full", className)}
    >
      <div className="flex w-full items-center gap-1">
        <CollapsibleTrigger
          className={cn(
            "hover:bg-muted/40 group-data-[state=open]/cgroup:bg-muted/60",
            "focus-visible:ring-ring/30 flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors outline-none focus-visible:ring-2"
          )}
          aria-label={label}
        >
          <ChevronRightIcon
            className="text-muted-foreground size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]/cgroup:rotate-90"
            aria-hidden
          />
          {Icon && (
            <Icon
              className="text-muted-foreground size-3.5 shrink-0"
              aria-hidden
            />
          )}
          <span className="text-foreground truncate text-sm font-medium">
            {label}
          </span>
          {typeof count === "number" && (
            <span className="text-muted-foreground text-xs tabular-nums">
              {count}
            </span>
          )}
          {meta !== undefined && (
            <span className="text-muted-foreground ml-auto text-xs tabular-nums">
              {meta}
            </span>
          )}
        </CollapsibleTrigger>

        {actions && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground size-7"
                  aria-label={`${label} actions`}
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              <MoreVerticalIcon className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4}>
              {actions}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <CollapsibleContent>
        <div className="border-muted ml-3 flex flex-col gap-1 border-l py-1 pl-3">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
