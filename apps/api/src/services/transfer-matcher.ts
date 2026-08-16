// Pure pair-detection logic for "auto-detect transfers" import/cleanup flow.
// Given a list of candidate non-transfer rows, returns groups of rows that
// look like the two halves of a transfer (same magnitude, opposite direction,
// different accounts, dates within tolerance).

import type { Transaction } from "@workspace/types";

export type MatcherCandidate = Pick<
  Transaction,
  | "id"
  | "accountId"
  | "type"
  | "amount"
  | "date"
  | "description"
  | "transferId"
>;

export type DetectedPair = {
  id: string;
  confidence: "explicit" | "high";
  rowIds: [string, string];
};

export type AmbiguousMatch = {
  id: string;
  rowId: string;
  candidateIds: string[];
};

export type MatcherResult = {
  pairs: DetectedPair[];
  ambiguous: AmbiguousMatch[];
};

function dayDiff(a: string, b: string): number {
  // Inputs are ISO date strings (YYYY-MM-DD). Parsing as Date and dividing by
  // ms-per-day handles any month/year boundary safely.
  const aMs = Date.parse(a);
  const bMs = Date.parse(b);
  if (Number.isNaN(aMs) || Number.isNaN(bMs)) return Infinity;
  return Math.abs(aMs - bMs) / 86_400_000;
}

function normalizeAmount(raw: string): string {
  // Storage convention is positive magnitude; defensively strip a leading minus.
  const trimmed = raw.trim();
  return trimmed.startsWith("-") ? trimmed.slice(1) : trimmed;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function matchTransfers(
  rows: MatcherCandidate[],
  options: { dateToleranceDays?: number } = {}
): MatcherResult {
  const tolerance = options.dateToleranceDays ?? 1;

  // Drop rows that are already TRANSFER — those are already merged.
  const eligible = rows.filter((r) => r.type !== "TRANSFER");

  const pairs: DetectedPair[] = [];
  const ambiguous: AmbiguousMatch[] = [];
  const consumed = new Set<string>();
  const emittedPairs = new Set<string>();

  // ---------- Pass 1: explicit pairs by transferId ------------
  // Rows that share a transferId and are on different accounts are an
  // unambiguous pair (this is how our own export round-trips and
  // transfer-in/-out tagged imports get handled).
  const byTransferId = new Map<string, MatcherCandidate[]>();
  for (const row of eligible) {
    if (!row.transferId) continue;
    const list = byTransferId.get(row.transferId) ?? [];
    list.push(row);
    byTransferId.set(row.transferId, list);
  }

  for (const [transferId, group] of byTransferId) {
    if (group.length !== 2) continue;
    const [a, b] = group as [MatcherCandidate, MatcherCandidate];
    if (a.accountId === b.accountId) continue;
    pairs.push({
      id: `explicit-${transferId}`,
      confidence: "explicit",
      rowIds: [a.id, b.id],
    });
    consumed.add(a.id);
    consumed.add(b.id);
    emittedPairs.add(pairKey(a.id, b.id));
  }

  // ---------- Pass 2: heuristic match by amount + date + opposite type ------
  // Bucket remaining rows by normalized amount.
  const byAmount = new Map<string, MatcherCandidate[]>();
  for (const row of eligible) {
    if (consumed.has(row.id)) continue;
    if (row.type !== "INCOME" && row.type !== "EXPENSE") continue;
    const key = normalizeAmount(row.amount);
    const list = byAmount.get(key) ?? [];
    list.push(row);
    byAmount.set(key, list);
  }

  // Find candidate counters for each row inside its amount bucket.
  // We compute candidates per-row first, then decide unambiguous vs ambiguous.
  const candidatesByRow = new Map<string, MatcherCandidate[]>();
  for (const bucket of byAmount.values()) {
    for (const row of bucket) {
      const counters = bucket.filter(
        (other) =>
          other.id !== row.id &&
          other.accountId !== row.accountId &&
          other.type !== row.type &&
          dayDiff(other.date, row.date) <= tolerance
      );
      if (counters.length > 0) candidatesByRow.set(row.id, counters);
    }
  }

  // Emit unambiguous pairs (each side has exactly one candidate, and they
  // point to each other). Iterate deterministically by row id to keep output
  // stable.
  const sortedIds = [...candidatesByRow.keys()].sort();
  for (const rowId of sortedIds) {
    if (consumed.has(rowId)) continue;
    const counters = candidatesByRow.get(rowId);
    if (!counters || counters.length !== 1) continue;
    const counter = counters[0]!;
    if (consumed.has(counter.id)) continue;
    const counterCounters = candidatesByRow.get(counter.id) ?? [];
    if (counterCounters.length !== 1) continue;
    if (counterCounters[0]!.id !== rowId) continue;

    const key = pairKey(rowId, counter.id);
    if (emittedPairs.has(key)) continue;
    emittedPairs.add(key);

    pairs.push({
      id: `auto-${key}`,
      confidence: "high",
      rowIds: [rowId, counter.id],
    });
    consumed.add(rowId);
    consumed.add(counter.id);
  }

  // Whatever still has candidates is ambiguous.
  for (const rowId of sortedIds) {
    if (consumed.has(rowId)) continue;
    const counters = candidatesByRow.get(rowId);
    if (!counters || counters.length === 0) continue;
    const remaining = counters.filter((c) => !consumed.has(c.id));
    if (remaining.length === 0) continue;
    ambiguous.push({
      id: `ambig-${rowId}`,
      rowId,
      candidateIds: remaining.map((c) => c.id).sort(),
    });
  }

  return { pairs, ambiguous };
}
