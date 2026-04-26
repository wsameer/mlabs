import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { useCategories } from "@/features/categories/api/use-categories";
import { PresetChips } from "./components/PresetChips";
import { CategoryMultiSelect } from "./components/CategoryMultiSelect";
import type { CategoryOption } from "./components/CategoryMultiSelect";
import { AmountRangeInputs } from "./components/AmountRangeInputs";
import { FilterResetButton } from "./components/FilterResetButton";
import { useTransactionFilters } from "./use-transaction-filters";
import { sanitizeCategoryIds } from "./filter-utils";

export function TransactionFiltersSheet() {
  const [open, setOpen] = useState(false);
  const { data: categories } = useCategories();
  const { filters, setFilters, resetFilters, activeFilterCount } =
    useTransactionFilters();

  const options: CategoryOption[] = useMemo(
    () =>
      (categories ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon ?? undefined,
        parentId: c.parentId ?? null,
      })),
    [categories]
  );

  useEffect(() => {
    if (!categories || !filters.categoryIds) return;
    const known = new Set(categories.map((c) => c.id));
    const cleaned = sanitizeCategoryIds(filters.categoryIds, known);
    if ((cleaned?.length ?? 0) !== (filters.categoryIds?.length ?? 0)) {
      setFilters({ categoryIds: cleaned });
    }
  }, [categories, filters.categoryIds, setFilters]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button type="button" variant="secondary" className="gap-1">
            <SlidersHorizontalIcon className="size-3" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-1 h-4 px-1 text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        }
      />
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Narrow the transactions list by preset, category, and amount.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6">
          <section className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Preset
            </span>
            <PresetChips
              value={filters.preset}
              onChange={(preset) => setFilters({ preset })}
            />
          </section>

          <section className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Category
            </span>
            <CategoryMultiSelect
              options={options}
              value={filters.categoryIds ?? []}
              onChange={(next) =>
                setFilters({ categoryIds: next.length > 0 ? next : undefined })
              }
              showInlinePills
            />
          </section>

          <section className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Amount
            </span>
            <AmountRangeInputs
              min={filters.minAmount}
              max={filters.maxAmount}
              onCommit={({ min, max }) =>
                setFilters({ minAmount: min, maxAmount: max })
              }
            />
          </section>

          <FilterResetButton
            visible={activeFilterCount > 0}
            onReset={() => {
              resetFilters();
              setOpen(false);
            }}
            className="self-start"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
