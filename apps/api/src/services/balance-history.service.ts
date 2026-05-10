import { inArray } from "drizzle-orm";

import { accounts, transactions } from "@workspace/db";

import { and, asc, db, eq, gte } from "../libs/db.js";

export interface BalanceHistoryPoint {
  date: string;
  balance: string;
}

export interface BalanceHistoryItem {
  accountId: string;
  points: BalanceHistoryPoint[];
}

export interface BalanceHistoryResult {
  items: BalanceHistoryItem[];
  days: number;
  asOf: string;
}

function toIsoDay(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export class BalanceHistoryService {
  async getBalanceHistory(
    profileId: string,
    days: number
  ): Promise<BalanceHistoryResult> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    const startIso = toIsoDay(start);

    const accountRows = await db
      .select()
      .from(accounts)
      .where(eq(accounts.profileId, profileId));

    const txnRows = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.profileId, profileId),
          gte(transactions.date, startIso)
        )
      )
      .orderBy(asc(transactions.transferId), asc(transactions.createdAt));

    // Resolve outflow leg for any transfer touching the window — fetch the
    // full pair so we can determine direction even when one leg is older.
    const transferIdsInWindow = new Set<string>();
    for (const r of txnRows) {
      if (r.type === "TRANSFER" && r.transferId) {
        transferIdsInWindow.add(r.transferId);
      }
    }

    const outflowIds = new Set<string>();
    if (transferIdsInWindow.size > 0) {
      const pairRows = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.profileId, profileId),
            inArray(transactions.transferId, [...transferIdsInWindow])
          )
        );

      const groups = new Map<string, typeof pairRows>();
      for (const r of pairRows) {
        if (!r.transferId) continue;
        const arr = groups.get(r.transferId) ?? [];
        arr.push(r);
        groups.set(r.transferId, arr);
      }
      for (const group of groups.values()) {
        if (group.length === 0) continue;
        const sorted = [...group].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
        outflowIds.add(sorted[0]!.id);
      }
    }

    const dayStrings: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - (days - 1 - i));
      dayStrings.push(toIsoDay(d));
    }

    const deltasByAccount = new Map<string, Map<string, number>>();
    for (const r of txnRows) {
      const amt = Number(r.amount);
      if (!Number.isFinite(amt)) continue;
      let delta = 0;
      if (r.type === "INCOME") delta = amt;
      else if (r.type === "EXPENSE") delta = -amt;
      else if (r.type === "TRANSFER") {
        delta = outflowIds.has(r.id) ? -amt : amt;
      }
      const dayMap =
        deltasByAccount.get(r.accountId) ?? new Map<string, number>();
      dayMap.set(r.date, (dayMap.get(r.date) ?? 0) + delta);
      deltasByAccount.set(r.accountId, dayMap);
    }

    const items: BalanceHistoryItem[] = accountRows.map((acc) => {
      const dayMap = deltasByAccount.get(acc.id) ?? new Map<string, number>();
      const balances = new Array<number>(days);
      const currentBalance = Number(acc.balance);
      // balance(end of day i) = currentBalance - sum(deltas on days strictly after i)
      let totalChangesAfter = 0;
      for (let i = days - 1; i >= 0; i--) {
        balances[i] = currentBalance - totalChangesAfter;
        totalChangesAfter += dayMap.get(dayStrings[i]!) ?? 0;
      }
      const points: BalanceHistoryPoint[] = balances.map((b, i) => ({
        date: dayStrings[i]!,
        balance: String(b),
      }));
      return { accountId: acc.id, points };
    });

    return { items, days, asOf: today.toISOString() };
  }
}

export const balanceHistoryService = new BalanceHistoryService();
