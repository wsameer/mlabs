import { describe, expect, it } from "vitest";
import type { CategoryWithSubcategories, Transaction } from "@workspace/types";
import {
  buildExportFilename,
  escapeCell,
  EXPORT_HEADERS,
  transactionsToCsv,
} from "./csv-build";

const CAT_UTILITIES = "00000000-0000-0000-0000-0000000000a1";
const SUB_HEAT_HYDRO = "00000000-0000-0000-0000-0000000000b1";
const CAT_SALARY = "00000000-0000-0000-0000-0000000000a2";

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

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: "t1",
    profileId: "p",
    accountId: "a1",
    type: "EXPENSE",
    direction: "OUTFLOW",
    amount: "10.00",
    signedAmount: "-10.00",
    date: "2026-05-01",
    isCleared: false,
    createdAt: "2026-05-01",
    updatedAt: "2026-05-01",
    ...overrides,
  };
}

describe("escapeCell", () => {
  it("returns plain values unchanged", () => {
    expect(escapeCell("hello")).toBe("hello");
  });

  it("wraps and doubles quotes when value contains a comma", () => {
    expect(escapeCell("a,b")).toBe('"a,b"');
  });

  it("doubles internal quotes", () => {
    expect(escapeCell('say "hi"')).toBe('"say ""hi"""');
  });

  it("wraps values with newlines", () => {
    expect(escapeCell("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("transactionsToCsv", () => {
  it("emits a header row matching EXPORT_HEADERS", () => {
    const csv = transactionsToCsv([], CATEGORIES);
    const [header] = csv.split("\n");
    expect(header).toBe(EXPORT_HEADERS.join(","));
  });

  it("writes income with positive signed amount and `income` type", () => {
    const csv = transactionsToCsv(
      [
        tx({
          type: "INCOME",
          direction: "INFLOW",
          amount: "600.00",
          signedAmount: "600.00",
          categoryId: CAT_SALARY,
          description: "Salary May",
        }),
      ],
      CATEGORIES
    );
    const lines = csv.trim().split("\n");
    expect(lines[1]).toBe("2026-05-01,600.00,income,Salary May,Salary,,,");
  });

  it("writes expense with subcategory name", () => {
    const csv = transactionsToCsv(
      [
        tx({
          amount: "450.00",
          signedAmount: "-450.00",
          categoryId: CAT_UTILITIES,
          subcategoryId: SUB_HEAT_HYDRO,
          description: "Metergy",
          date: "2026-04-22",
        }),
      ],
      CATEGORIES
    );
    const lines = csv.trim().split("\n");
    expect(lines[1]).toBe(
      "2026-04-22,-450.00,expense,Metergy,Utilities,Heat & Hydro,,"
    );
  });

  it("writes transfer-out and transfer-in with Transfer ID and no category", () => {
    const csv = transactionsToCsv(
      [
        tx({
          id: "t-out",
          type: "TRANSFER",
          direction: "OUTFLOW",
          amount: "5000.00",
          signedAmount: "-5000.00",
          transferId: "XFER-A",
          date: "2026-05-02",
          description: "EQ to WS",
        }),
        tx({
          id: "t-in",
          type: "TRANSFER",
          direction: "INFLOW",
          amount: "5000.00",
          signedAmount: "5000.00",
          transferId: "XFER-A",
          date: "2026-05-02",
          description: "EQ to WS",
        }),
      ],
      CATEGORIES
    );
    const lines = csv.trim().split("\n");
    expect(lines[1]).toBe(
      "2026-05-02,-5000.00,transfer-out,EQ to WS,,,XFER-A,"
    );
    expect(lines[2]).toBe("2026-05-02,5000.00,transfer-in,EQ to WS,,,XFER-A,");
  });

  it("escapes cells containing commas, quotes, and newlines", () => {
    const csv = transactionsToCsv(
      [
        tx({
          description: 'Coffee, "the good kind"',
          notes: "line1\nline2",
        }),
      ],
      CATEGORIES
    );
    expect(csv).toContain('"Coffee, ""the good kind"""');
    expect(csv).toContain('"line1\nline2"');
  });

  it("leaves category cells empty when the category id is not in the lookup", () => {
    const csv = transactionsToCsv(
      [tx({ categoryId: "missing-id" })],
      CATEGORIES
    );
    const lines = csv.trim().split("\n");
    expect(lines[1]).toBe("2026-05-01,-10.00,expense,,,,,");
  });
});

describe("buildExportFilename", () => {
  it("slugs the account name and zero-pads the date", () => {
    const name = buildExportFilename("EQ Bank Savings", new Date(2026, 4, 9));
    expect(name).toBe("mlabs-eq-bank-savings-2026-05-09.csv");
  });

  it("falls back when the account name has no alphanumerics", () => {
    const name = buildExportFilename("***", new Date(2026, 0, 1));
    expect(name).toBe("mlabs-account-2026-01-01.csv");
  });
});
