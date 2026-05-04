import { describe, expect, it } from "vitest";
import type { CategoryWithSubcategories } from "@workspace/types";
import { transformRows, toApiPayload } from "./csv-transform";
import type { ColumnMapping } from "../types";

const CAT_UTILITIES = "00000000-0000-0000-0000-0000000000a1";
const CAT_SALARY = "00000000-0000-0000-0000-0000000000a2";
const SUB_HEAT_HYDRO = "00000000-0000-0000-0000-0000000000b1";

const CATEGORIES: CategoryWithSubcategories[] = [
  {
    id: CAT_UTILITIES,
    profileId: "p",
    name: "Utilities",
    type: "EXPENSE",
    isActive: true,
    sortOrder: 0,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    subcategories: [
      {
        id: SUB_HEAT_HYDRO,
        profileId: "p",
        name: "Heat & Hydro",
        type: "EXPENSE",
        parentId: CAT_UTILITIES,
        isActive: true,
        sortOrder: 0,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ],
  },
  {
    id: CAT_SALARY,
    profileId: "p",
    name: "Salary",
    type: "INCOME",
    isActive: true,
    sortOrder: 0,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    subcategories: [],
  },
];

// Columns: 0:Date 1:Account 2:Amount 3:Type 4:Note 5:Category 6:Sub-category 7:Currency 8:TransferId
const MAPPING: ColumnMapping = {
  date: 0,
  amount: 2,
  type: 3,
  description: 4,
  category: 5,
  subcategory: 6,
  transferId: 8,
};

function row(...cells: string[]): string[] {
  return cells;
}

describe("transformRows — type column resolution", () => {
  it("maps Transfer-Out to EXPENSE, flags leg OUT, and omits category", () => {
    const [r] = transformRows(
      [
        row(
          "2026-05-02",
          "EQ Bank",
          "-5000.00",
          "Transfer-Out",
          "EQ to WS",
          "Internal Transfer",
          "",
          "CAD",
          "XFER-A"
        ),
      ],
      MAPPING,
      "signed",
      CATEGORIES
    );
    expect(r?.type).toBe("EXPENSE");
    expect(r?.isTransferLeg).toBe(true);
    expect(r?.transferLeg).toBe("OUT");
    expect(r?.categoryId).toBeUndefined();
    expect(r?.subcategoryId).toBeUndefined();
    expect(r?.category).toBe("");
    expect(r?.transferId).toBe("XFER-A");
    expect(r?.description).toBe("EQ to WS");
    expect(r?.notes).toBe("");
  });

  it("maps Transfer-In to INCOME, flags leg IN, and omits category", () => {
    const [r] = transformRows(
      [
        row(
          "2026-05-02",
          "WealthSimple Cash",
          "5000.00",
          "Transfer-In",
          "",
          "Internal Transfer",
          "",
          "CAD",
          "XFER-A"
        ),
      ],
      MAPPING,
      "signed",
      CATEGORIES
    );
    expect(r?.type).toBe("INCOME");
    expect(r?.isTransferLeg).toBe(true);
    expect(r?.transferLeg).toBe("IN");
    expect(r?.categoryId).toBeUndefined();
    expect(r?.transferId).toBe("XFER-A");
  });

  it("maps Income type to INCOME and resolves the category normally", () => {
    const [r] = transformRows(
      [
        row(
          "2026-05-01",
          "EQ Bank",
          "600.00",
          "Income",
          "salary",
          "Salary",
          "",
          "CAD",
          ""
        ),
      ],
      MAPPING,
      "signed",
      CATEGORIES
    );
    expect(r?.type).toBe("INCOME");
    expect(r?.isTransferLeg).toBe(false);
    expect(r?.categoryId).toBe(CAT_SALARY);
    expect(r?.transferId).toBeUndefined();
  });

  it("warns and falls back to amount-sign when type value is unknown", () => {
    const [r] = transformRows(
      [
        row(
          "2026-05-01",
          "EQ Bank",
          "-50.00",
          "Gibberish",
          "",
          "",
          "",
          "CAD",
          ""
        ),
      ],
      MAPPING,
      "signed",
      CATEGORIES
    );
    expect(r?.type).toBe("EXPENSE");
    expect(r?.isTransferLeg).toBe(false);
    expect(r?.validation.warnings).toContainEqual(
      expect.stringContaining("Unknown type")
    );
  });

  it("falls back to amount-sign silently when type column is not mapped", () => {
    const mapping: ColumnMapping = { ...MAPPING, type: null };
    const [r] = transformRows(
      [
        row(
          "2026-05-01",
          "EQ Bank",
          "-50.00",
          "Anything",
          "",
          "",
          "",
          "CAD",
          ""
        ),
      ],
      mapping,
      "signed",
      CATEGORIES
    );
    expect(r?.type).toBe("EXPENSE");
    expect(r?.validation.warnings).not.toContainEqual(
      expect.stringContaining("Unknown type")
    );
  });
});

describe("transformRows — subcategory resolution", () => {
  it("resolves (parent, sub) to parent categoryId and subcategoryId", () => {
    const [r] = transformRows(
      [
        row(
          "2026-04-22",
          "WS Cash",
          "-450.00",
          "Expense",
          "Metergy",
          "Utilities",
          "Heat & Hydro",
          "CAD",
          ""
        ),
      ],
      MAPPING,
      "signed",
      CATEGORIES
    );
    expect(r?.categoryId).toBe(CAT_UTILITIES);
    expect(r?.subcategoryId).toBe(SUB_HEAT_HYDRO);
  });

  it("warns and keeps parent when subcategory doesn't exist under the parent", () => {
    const [r] = transformRows(
      [
        row(
          "2026-04-22",
          "WS Cash",
          "-450.00",
          "Expense",
          "",
          "Utilities",
          "Made-up Sub",
          "CAD",
          ""
        ),
      ],
      MAPPING,
      "signed",
      CATEGORIES
    );
    expect(r?.categoryId).toBe(CAT_UTILITIES);
    expect(r?.subcategoryId).toBeUndefined();
    expect(r?.validation.warnings).toContainEqual(
      expect.stringContaining("Subcategory")
    );
  });

  it("leaves categoryId undefined when parent name doesn't match any category", () => {
    const [r] = transformRows(
      [
        row(
          "2026-04-22",
          "WS Cash",
          "-10.00",
          "Expense",
          "",
          "NoSuchCategory",
          "",
          "CAD",
          ""
        ),
      ],
      MAPPING,
      "signed",
      CATEGORIES
    );
    expect(r?.categoryId).toBeUndefined();
    expect(r?.subcategoryId).toBeUndefined();
  });
});

describe("toApiPayload", () => {
  it("includes transferId and omits categoryId on transfer legs", () => {
    const rows = transformRows(
      [
        row(
          "2026-05-02",
          "EQ Bank",
          "-5000.00",
          "Transfer-Out",
          "EQ to WS",
          "Internal Transfer",
          "",
          "CAD",
          "XFER-A"
        ),
      ],
      MAPPING,
      "signed",
      CATEGORIES
    );
    const [p] = toApiPayload(rows, "acct-1");
    expect(p?.type).toBe("EXPENSE");
    expect(p?.transferId).toBe("XFER-A");
    expect(p?.categoryId).toBeUndefined();
    expect(p?.subcategoryId).toBeUndefined();
  });

  it("forwards subcategoryId on non-transfer rows", () => {
    const rows = transformRows(
      [
        row(
          "2026-04-22",
          "WS Cash",
          "-450.00",
          "Expense",
          "Metergy",
          "Utilities",
          "Heat & Hydro",
          "CAD",
          ""
        ),
      ],
      MAPPING,
      "signed",
      CATEGORIES
    );
    const [p] = toApiPayload(rows, "acct-1");
    expect(p?.categoryId).toBe(CAT_UTILITIES);
    expect(p?.subcategoryId).toBe(SUB_HEAT_HYDRO);
    expect(p?.transferId).toBeUndefined();
  });
});
