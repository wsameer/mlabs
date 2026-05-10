import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronRightIcon, EllipsisIcon } from "lucide-react";

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
            "group-data-[state=open]/cgroup:bg-muted/60 hover:bg-muted/40",
            "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          )}
          aria-label={label}
        >
          <ChevronRightIcon
            className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/cgroup:rotate-90"
            aria-hidden
          />
          {Icon && (
            <Icon
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden
            />
          )}
          <small className="truncate text-xs font-medium">{label}</small>
          {/*<span className="truncate text-xs font-medium text-foreground">
            {label}
          </span>*/}
          {typeof count === "number" && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {count}
            </span>
          )}
          {meta !== undefined && (
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
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
                  className="size-7 text-muted-foreground hover:text-foreground"
                  aria-label={`${label} actions`}
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              <EllipsisIcon className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4}>
              {actions}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <CollapsibleContent>
        <div className="ml-3 flex flex-col gap-1 border-l border-muted py-1 pl-3">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
