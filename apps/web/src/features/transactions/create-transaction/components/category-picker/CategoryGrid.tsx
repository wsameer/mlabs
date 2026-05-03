import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon } from "lucide-react";

import type { Category } from "@workspace/types";
import { Input } from "@workspace/ui/components/input";
import { Empty, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty";
import { cn } from "@workspace/ui/lib/utils";

import { CategoryTile } from "./CategoryTile";

const SEARCH_THRESHOLD = 9;

interface CategoryGridProps {
  items: Category[];
  hasChildrenMap?: Record<string, boolean>;
  selectedId?: string;
  onSelect: (category: Category) => void;
  onBack?: () => void;
  testIdPrefix?: string;
}

export function CategoryGrid({
  items,
  hasChildrenMap,
  selectedId,
  onSelect,
  onBack,
  testIdPrefix,
}: CategoryGridProps) {
  const [filter, setFilter] = useState("");
  const [focusIndex, setFocusIndex] = useState(0);
  const [prevItems, setPrevItems] = useState(items);
  const [prevFilter, setPrevFilter] = useState(filter);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const showSearch = items.length > SEARCH_THRESHOLD;

  const filtered = useMemo(() => {
    if (!filter.trim()) return items;
    const q = filter.trim().toLowerCase();
    return items.filter((c) => c.name.toLowerCase().includes(q));
  }, [items, filter]);

  if (items !== prevItems || filter !== prevFilter) {
    setPrevItems(items);
    setPrevFilter(filter);
    setFocusIndex(0);
  }

  useEffect(() => {
    if (!filtered.length) return;
    tileRefs.current[focusIndex]?.focus();
  }, [focusIndex, filtered]);

  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!filtered.length) return;
      const cols = 3;
      let next = focusIndex;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(focusIndex + 1, filtered.length - 1);
          break;
        case "ArrowLeft":
          if (focusIndex === 0 && onBack) {
            e.preventDefault();
            onBack();
            return;
          }
          next = Math.max(focusIndex - 1, 0);
          break;
        case "ArrowDown":
          next = Math.min(focusIndex + cols, filtered.length - 1);
          break;
        case "ArrowUp":
          if (focusIndex < cols && showSearch) {
            e.preventDefault();
            searchRef.current?.focus();
            return;
          }
          next = Math.max(focusIndex - cols, 0);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = filtered.length - 1;
          break;
        default:
          return;
      }
      e.preventDefault();
      setFocusIndex(next);
    },
    [filtered, focusIndex, onBack, showSearch]
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        tileRefs.current[0]?.focus();
        setFocusIndex(0);
      } else if (e.key === "Backspace" && filter === "" && onBack) {
        e.preventDefault();
        onBack();
      } else if (e.key === "Enter" && filtered.length > 0) {
        e.preventDefault();
        const first = filtered[0];
        if (first) onSelect(first);
      }
    },
    [filter, filtered, onBack, onSelect]
  );

  return (
    <div className="flex flex-col gap-2">
      {showSearch && (
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search..."
            className="h-7 pl-7 text-xs"
            autoFocus
            data-testid={testIdPrefix ? `${testIdPrefix}-search` : undefined}
          />
        </div>
      )}
      {filtered.length === 0 ? (
        <Empty className="py-6">
          <EmptyHeader>
            <EmptyTitle className="text-xs text-muted-foreground">
              No matches
            </EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <div
          role="listbox"
          onKeyDown={handleGridKeyDown}
          className={cn(
            "grid gap-1 overflow-y-auto pr-0.5",
            "max-h-[min(11rem,36svh)]",
            "grid-cols-[repeat(auto-fill,minmax(64px,1fr))]"
          )}
        >
          {filtered.map((category, i) => (
            <CategoryTile
              key={category.id}
              ref={(el) => {
                tileRefs.current[i] = el;
              }}
              category={category}
              hasChildren={hasChildrenMap?.[category.id]}
              selected={category.id === selectedId}
              onClick={() => onSelect(category)}
              onFocus={() => setFocusIndex(i)}
              tabIndex={i === focusIndex ? 0 : -1}
              testId={
                testIdPrefix ? `${testIdPrefix}-tile-${category.id}` : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
