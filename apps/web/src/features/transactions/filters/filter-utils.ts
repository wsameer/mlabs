import type { TransactionQuery } from "@workspace/types";
import type { TransactionFilterState } from "./filter-types";

function hasSearch(q: string | undefined): boolean {
  return !!q && q.trim().length > 0;
}

export function getActiveFilterCount(state: TransactionFilterState): number {
  let count = 0;
  if (state.preset !== "all") count += 1;
  if (hasSearch(state.q)) count += 1;
  if (state.categoryIds && state.categoryIds.length > 0) count += 1;
  if (state.minAmount !== undefined) count += 1;
  if (state.maxAmount !== undefined) count += 1;
  return count;
}

export function toApiQuery(
  state: TransactionFilterState,
  range: { startDate: string; endDate: string }
): TransactionQuery {
  const base: TransactionQuery = {
    startDate: range.startDate,
    endDate: range.endDate,
  };

  if (state.preset === "uncategorized") {
    base.uncategorizedOnly = true;
  } else if (state.preset === "income") {
    base.type = "INCOME";
  } else if (state.preset === "expenses") {
    base.type = "EXPENSE";
  }

  if (state.preset !== "uncategorized" && state.categoryIds?.length) {
    base.categoryIds = state.categoryIds;
  }

  if (hasSearch(state.q)) {
    base.search = state.q!.trim();
  }

  if (state.minAmount !== undefined) {
    base.minAmount = String(state.minAmount);
  }
  if (state.maxAmount !== undefined) {
    base.maxAmount = String(state.maxAmount);
  }

  return base;
}

export function sanitizeCategoryIds(
  ids: string[] | undefined,
  known: Set<string>
): string[] | undefined {
  if (!ids || ids.length === 0) return undefined;
  const kept = ids.filter((id) => known.has(id));
  return kept.length > 0 ? kept : undefined;
}

export function swapIfInverted(
  min: number | undefined,
  max: number | undefined
): { min: number | undefined; max: number | undefined } {
  if (min !== undefined && max !== undefined && min > max) {
    return { min: max, max: min };
  }
  return { min, max };
}
