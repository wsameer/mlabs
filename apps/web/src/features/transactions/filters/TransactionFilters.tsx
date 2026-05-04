import { useEffect, useMemo } from "react";
import { useCategories } from "@/features/categories/api/use-categories";
import { PresetChips } from "./components/PresetChips";
import { SearchInput } from "./components/SearchInput";
import { CategoryMultiSelect } from "./components/CategoryMultiSelect";
import type { CategoryOption } from "./components/CategoryMultiSelect";
import { AmountRangeInputs } from "./components/AmountRangeInputs";
import { FilterResetButton } from "./components/FilterResetButton";
import { useTransactionFilters } from "./use-transaction-filters";
import { sanitizeCategoryIds } from "./filter-utils";

export function TransactionFilters({ disabled }: { disabled?: boolean }) {
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

  // Clean stale category IDs once categories load
  useEffect(() => {
    if (!categories || !filters.categoryIds) return;
    const known = new Set(categories.map((c) => c.id));
    const cleaned = sanitizeCategoryIds(filters.categoryIds, known);
    if ((cleaned?.length ?? 0) !== (filters.categoryIds?.length ?? 0)) {
      setFilters({ categoryIds: cleaned });
    }
  }, [categories, filters.categoryIds, setFilters]);

  return (
    <div className="flex flex-col gap-2">
      <PresetChips
        value={filters.preset}
        onChange={(preset) => setFilters({ preset })}
        disabled={disabled}
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={filters.q ?? ""}
          onDebouncedChange={(next) =>
            setFilters({ q: next.length > 0 ? next : undefined })
          }
          disabled={disabled}
          className="min-w-55 flex-1"
        />

        <AmountRangeInputs
          min={filters.minAmount}
          max={filters.maxAmount}
          onCommit={({ min, max }) =>
            setFilters({ minAmount: min, maxAmount: max })
          }
          disabled={disabled}
        />

        <CategoryMultiSelect
          options={options}
          value={filters.categoryIds ?? []}
          onChange={(next) =>
            setFilters({ categoryIds: next.length > 0 ? next : undefined })
          }
          disabled={disabled}
        />

        <FilterResetButton
          visible={activeFilterCount > 0}
          onReset={resetFilters}
        />
      </div>
    </div>
  );
}
