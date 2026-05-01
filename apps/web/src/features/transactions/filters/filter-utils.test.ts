import { describe, expect, it } from "vitest";
import {
  getActiveFilterCount,
  sanitizeCategoryIds,
  swapIfInverted,
  toApiQuery,
} from "./filter-utils";
import type { TransactionFilterState } from "./filter-types";

const BASE: TransactionFilterState = { preset: "all" };

describe("getActiveFilterCount", () => {
  it("returns 0 for defaults", () => {
    expect(getActiveFilterCount(BASE)).toBe(0);
  });

  it("counts each non-default filter exactly once", () => {
    expect(
      getActiveFilterCount({
        preset: "uncategorized",
        q: "chipotle",
        categoryIds: ["id-1"],
        minAmount: 10,
        maxAmount: 100,
      })
    ).toBe(5);
  });

  it("does not count empty search string", () => {
    expect(getActiveFilterCount({ preset: "all", q: "" })).toBe(0);
  });

  it("does not count empty categoryIds array", () => {
    expect(getActiveFilterCount({ preset: "all", categoryIds: [] })).toBe(0);
  });

  it("does not count whitespace-only search", () => {
    expect(getActiveFilterCount({ preset: "all", q: "   " })).toBe(0);
  });
});

describe("toApiQuery", () => {
  const range = { startDate: "2026-04-01", endDate: "2026-04-30" };

  it("maps preset=all to no type / no uncategorizedOnly", () => {
    const q = toApiQuery({ preset: "all" }, range);
    expect(q.type).toBeUndefined();
    expect(q.uncategorizedOnly).toBeUndefined();
    expect(q.startDate).toBe("2026-04-01");
    expect(q.endDate).toBe("2026-04-30");
  });

  it("maps preset=uncategorized to uncategorizedOnly=true and drops categoryIds", () => {
    const q = toApiQuery(
      { preset: "uncategorized", categoryIds: ["id-1"] },
      range
    );
    expect(q.uncategorizedOnly).toBe(true);
    expect(q.categoryIds).toBeUndefined();
  });

  it("maps preset=income to type=INCOME", () => {
    expect(toApiQuery({ preset: "income" }, range).type).toBe("INCOME");
  });

  it("maps preset=expenses to type=EXPENSE", () => {
    expect(toApiQuery({ preset: "expenses" }, range).type).toBe("EXPENSE");
  });

  it("passes q as search, and amount fields as strings", () => {
    const q = toApiQuery(
      { preset: "all", q: "chipotle", minAmount: 10, maxAmount: 100 },
      range
    );
    expect(q.search).toBe("chipotle");
    expect(q.minAmount).toBe("10");
    expect(q.maxAmount).toBe("100");
  });

  it("passes categoryIds when preset is not uncategorized", () => {
    const q = toApiQuery(
      { preset: "all", categoryIds: ["a", "b"] },
      range
    );
    expect(q.categoryIds).toEqual(["a", "b"]);
  });

  it("omits search when q is only whitespace", () => {
    const q = toApiQuery({ preset: "all", q: "   " }, range);
    expect(q.search).toBeUndefined();
  });

  it("trims surrounding whitespace from search", () => {
    const q = toApiQuery({ preset: "all", q: "  chipotle  " }, range);
    expect(q.search).toBe("chipotle");
  });
});

describe("sanitizeCategoryIds", () => {
  it("keeps only ids that exist in the known set", () => {
    expect(sanitizeCategoryIds(["a", "b", "c"], new Set(["a", "c"]))).toEqual([
      "a",
      "c",
    ]);
  });

  it("returns undefined when input is undefined or empty", () => {
    expect(sanitizeCategoryIds(undefined, new Set(["a"]))).toBeUndefined();
    expect(sanitizeCategoryIds([], new Set(["a"]))).toBeUndefined();
  });

  it("returns undefined when all ids are unknown", () => {
    expect(sanitizeCategoryIds(["x", "y"], new Set(["a"]))).toBeUndefined();
  });
});

describe("swapIfInverted", () => {
  it("swaps when min > max", () => {
    expect(swapIfInverted(50, 10)).toEqual({ min: 10, max: 50 });
  });

  it("leaves values alone when in order", () => {
    expect(swapIfInverted(10, 50)).toEqual({ min: 10, max: 50 });
  });

  it("no-ops when either side is undefined", () => {
    expect(swapIfInverted(undefined, 50)).toEqual({ min: undefined, max: 50 });
    expect(swapIfInverted(10, undefined)).toEqual({ min: 10, max: undefined });
  });
});
