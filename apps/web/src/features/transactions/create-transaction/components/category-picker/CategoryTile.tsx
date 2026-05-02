import { forwardRef } from "react";
import { ChevronRightIcon } from "lucide-react";

import type { Category } from "@workspace/types";
import { cn } from "@workspace/ui/lib/utils";

interface CategoryTileProps {
  category: Category;
  hasChildren?: boolean;
  selected?: boolean;
  onClick: () => void;
  onFocus?: () => void;
  tabIndex?: number;
  testId?: string;
}

export const CategoryTile = forwardRef<HTMLButtonElement, CategoryTileProps>(
  function CategoryTile(
    { category, hasChildren, selected, onClick, onFocus, tabIndex, testId },
    ref
  ) {
    const swatchStyle = category.color
      ? { backgroundColor: `${category.color}26` }
      : undefined;

    return (
      <button
        ref={ref}
        type="button"
        role="option"
        aria-selected={selected}
        aria-label={category.name}
        onClick={onClick}
        onFocus={onFocus}
        tabIndex={tabIndex}
        data-testid={testId}
        className={cn(
          "group/tile relative flex aspect-[1.15/1] min-w-0 flex-col items-center justify-center gap-1 rounded-md border border-border/60 bg-card p-1.5 text-center transition-all",
          "hover:border-border hover:bg-muted/60",
          "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
          selected &&
            "border-primary/60 bg-primary/5 ring-1 ring-primary/30"
        )}
      >
        <span
          className="flex size-6 items-center justify-center rounded text-sm leading-none"
          style={swatchStyle}
          aria-hidden
        >
          {category.icon ?? "•"}
        </span>
        <span className="line-clamp-2 w-full break-words text-[10px]/tight font-medium text-foreground">
          {category.name}
        </span>
        {hasChildren && (
          <ChevronRightIcon
            className="absolute right-1 top-1 size-2.5 text-muted-foreground/70"
            aria-hidden
          />
        )}
      </button>
    );
  }
);
