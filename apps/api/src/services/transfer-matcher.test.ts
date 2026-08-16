import { describe, expect, it } from "vitest";
import { matchTransfers, type MatcherCandidate } from "./transfer-matcher.js";

function row(over: Partial<MatcherCandidate>): MatcherCandidate {
  return {
    id: "r1",
    accountId: "a1",
    type: "EXPENSE",
    amount: "100.00",
    date: "2026-05-01",
    transferId: undefined,
    ...over,
  };
}

describe("matchTransfers — explicit pairs by transferId", () => {
  it("pairs two rows sharing a transferId on different accounts as explicit", () => {
    const result = matchTransfers([
      row({ id: "x1", accountId: "a1", type: "EXPENSE", transferId: "T-1" }),
      row({ id: "x2", accountId: "a2", type: "INCOME", transferId: "T-1" }),
    ]);
    expect(result.pairs).toHaveLength(1);
    expect(result.pairs[0]?.confidence).toBe("explicit");
    expect(result.pairs[0]?.rowIds.sort()).toEqual(["x1", "x2"]);
    expect(result.ambiguous).toHaveLength(0);
  });

  it("does not pair two rows with the same transferId on the same account", () => {
    const result = matchTransfers([
      row({ id: "x1", accountId: "a1", type: "EXPENSE", transferId: "T-1" }),
      row({ id: "x2", accountId: "a1", type: "INCOME", transferId: "T-1" }),
    ]);
    expect(result.pairs).toHaveLength(0);
  });

  it("does not pair when 3+ rows share a transferId (ambiguous group, leave for manual review)", () => {
    const result = matchTransfers([
      row({ id: "x1", accountId: "a1", type: "EXPENSE", transferId: "T-1" }),
      row({ id: "x2", accountId: "a2", type: "INCOME", transferId: "T-1" }),
      row({ id: "x3", accountId: "a3", type: "INCOME", transferId: "T-1" }),
    ]);
    expect(result.pairs).toHaveLength(0);
  });
});

describe("matchTransfers — heuristic high-confidence pairs", () => {
  it("pairs same amount, opposite type, different accounts, same date", () => {
    const result = matchTransfers([
      row({ id: "x1", accountId: "a1", type: "EXPENSE" }),
      row({ id: "x2", accountId: "a2", type: "INCOME" }),
    ]);
    expect(result.pairs).toHaveLength(1);
    expect(result.pairs[0]?.confidence).toBe("high");
    expect(result.pairs[0]?.rowIds.sort()).toEqual(["x1", "x2"]);
  });

  it("matches within ±1 day tolerance by default", () => {
    const result = matchTransfers([
      row({ id: "x1", accountId: "a1", type: "EXPENSE", date: "2026-05-01" }),
      row({ id: "x2", accountId: "a2", type: "INCOME", date: "2026-05-02" }),
    ]);
    expect(result.pairs).toHaveLength(1);
  });

  it("does not match outside the date tolerance", () => {
    const result = matchTransfers([
      row({ id: "x1", accountId: "a1", type: "EXPENSE", date: "2026-05-01" }),
      row({ id: "x2", accountId: "a2", type: "INCOME", date: "2026-05-05" }),
    ]);
    expect(result.pairs).toHaveLength(0);
    expect(result.ambiguous).toHaveLength(0);
  });

  it("respects custom dateToleranceDays", () => {
    const result = matchTransfers(
      [
        row({ id: "x1", accountId: "a1", type: "EXPENSE", date: "2026-05-01" }),
        row({ id: "x2", accountId: "a2", type: "INCOME", date: "2026-05-04" }),
      ],
      { dateToleranceDays: 3 }
    );
    expect(result.pairs).toHaveLength(1);
  });

  it("does not pair same-direction rows even if amount/account/date match", () => {
    const result = matchTransfers([
      row({ id: "x1", accountId: "a1", type: "EXPENSE" }),
      row({ id: "x2", accountId: "a2", type: "EXPENSE" }),
    ]);
    expect(result.pairs).toHaveLength(0);
  });

  it("does not pair on the same account", () => {
    const result = matchTransfers([
      row({ id: "x1", accountId: "a1", type: "EXPENSE" }),
      row({ id: "x2", accountId: "a1", type: "INCOME" }),
    ]);
    expect(result.pairs).toHaveLength(0);
  });

  it("normalizes amounts (signed vs unsigned should still match)", () => {
    const result = matchTransfers([
      row({ id: "x1", accountId: "a1", type: "EXPENSE", amount: "-100.00" }),
      row({ id: "x2", accountId: "a2", type: "INCOME", amount: "100.00" }),
    ]);
    expect(result.pairs).toHaveLength(1);
  });
});

describe("matchTransfers — ambiguous", () => {
  it("returns an ambiguous entry when one row has multiple counter candidates", () => {
    const result = matchTransfers([
      row({ id: "x1", accountId: "a1", type: "EXPENSE", date: "2026-05-01" }),
      row({ id: "x2", accountId: "a2", type: "INCOME", date: "2026-05-01" }),
      row({ id: "x3", accountId: "a3", type: "INCOME", date: "2026-05-01" }),
    ]);
    expect(result.pairs).toHaveLength(0);
    expect(result.ambiguous).toHaveLength(3);
    const x1 = result.ambiguous.find((a) => a.rowId === "x1");
    expect(x1?.candidateIds.sort()).toEqual(["x2", "x3"]);
  });

  it("explicit transferId overrides ambiguity for the explicit pair", () => {
    const result = matchTransfers([
      row({ id: "x1", accountId: "a1", type: "EXPENSE", transferId: "T-1" }),
      row({ id: "x2", accountId: "a2", type: "INCOME", transferId: "T-1" }),
      // Decoy with the same amount/date — should not be paired with x1 because
      // x1 is already consumed by the explicit pair.
      row({ id: "x3", accountId: "a3", type: "INCOME" }),
    ]);
    expect(result.pairs).toHaveLength(1);
    expect(result.pairs[0]?.confidence).toBe("explicit");
    // x3 has no remaining counter candidate (x1 is consumed), so no pair, no ambiguity.
    expect(result.ambiguous).toHaveLength(0);
  });
});

describe("matchTransfers — already-merged rows", () => {
  it("ignores rows that are already TYPE=TRANSFER", () => {
    const result = matchTransfers([
      row({ id: "x1", accountId: "a1", type: "TRANSFER" }),
      row({ id: "x2", accountId: "a2", type: "INCOME" }),
    ]);
    expect(result.pairs).toHaveLength(0);
    expect(result.ambiguous).toHaveLength(0);
  });
});

describe("matchTransfers — output stability", () => {
  it("produces stable ids for the same input", () => {
    const input = [
      row({ id: "z2", accountId: "a2", type: "INCOME" }),
      row({ id: "z1", accountId: "a1", type: "EXPENSE" }),
    ];
    const a = matchTransfers(input);
    const b = matchTransfers([...input].reverse());
    expect(a.pairs[0]?.id).toBe(b.pairs[0]?.id);
  });
});
