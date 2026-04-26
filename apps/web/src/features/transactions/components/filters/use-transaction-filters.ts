import { useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type {
  TransactionFilterPreset,
  TransactionFilterState,
} from "./filter-types";
import { DEFAULT_TRANSACTION_FILTERS } from "./filter-types";
import { getActiveFilterCount, swapIfInverted } from "./filter-utils";

type Patch = Partial<TransactionFilterState>;

function stripDefaults(
  next: TransactionFilterState
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (next.preset !== "all") out.preset = next.preset;
  if (next.q && next.q.length > 0) out.q = next.q;
  if (next.categoryIds && next.categoryIds.length > 0)
    out.categoryIds = next.categoryIds;
  if (next.minAmount !== undefined) out.minAmount = next.minAmount;
  if (next.maxAmount !== undefined) out.maxAmount = next.maxAmount;
  return out;
}

export function useTransactionFilters() {
  const filters = useSearch({ strict: false }) as TransactionFilterState;
  const navigate = useNavigate();

  const setFilters = useCallback(
    (patch: Patch) => {
      const merged: TransactionFilterState = {
        ...DEFAULT_TRANSACTION_FILTERS,
        ...filters,
        ...patch,
      };

      // Preset ↔ category mutual exclusion:
      // picking categories while on "uncategorized" drops the preset back to "all".
      if (
        merged.preset === "uncategorized" &&
        patch.categoryIds &&
        patch.categoryIds.length > 0
      ) {
        merged.preset = "all";
      }

      // Amount invariant: if the user committed min > max, swap silently.
      const { min, max } = swapIfInverted(merged.minAmount, merged.maxAmount);
      merged.minAmount = min;
      merged.maxAmount = max;

      void navigate({
        search: stripDefaults(merged) as never,
        replace: true,
      });
    },
    [filters, navigate]
  );

  const resetFilters = useCallback(() => {
    void navigate({
      search: {} as never,
      replace: true,
    });
  }, [navigate]);

  const setPreset = useCallback(
    (preset: TransactionFilterPreset) => setFilters({ preset }),
    [setFilters]
  );

  return {
    filters,
    setFilters,
    setPreset,
    resetFilters,
    activeFilterCount: getActiveFilterCount(filters),
  };
}
