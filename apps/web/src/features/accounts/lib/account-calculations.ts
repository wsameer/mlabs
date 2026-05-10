import type { Account, AccountGroupType } from "@workspace/types";
import { ACCOUNT_GROUP_METADATA } from "./account-groups";

export interface AccountTotals {
  assets: number;
  liabilities: number;
  netWorth: number;
}

/**
 * Calculate total assets, liabilities, and net worth from accounts
 *
 * Business logic:
 * - Assets: Sum of all non-liability account balances where includeInNetWorth is true
 * - Liabilities: Sum of absolute values of liability account balances where includeInNetWorth is true
 * - Net Worth: Assets - Liabilities
 */
export function calculateAccountTotals(accounts: Account[]): AccountTotals {
  let assets = 0;
  let liabilities = 0;

  accounts.forEach((account) => {
    // Skip accounts not included in net worth calculations
    if (!account.includeInNetWorth || !account.isActive) {
      return;
    }

    const balance = parseFloat(account.balance);
    const metadata = ACCOUNT_GROUP_METADATA[account.group];

    if (metadata.isLiability) {
      // Liabilities are typically negative or represent debt
      // We want the absolute value for display
      liabilities += Math.abs(balance);
    } else {
      // Assets
      assets += balance;
    }
  });

  return {
    assets,
    liabilities,
    netWorth: assets - liabilities,
  };
}

/**
 * Calculate total balance for a specific account group
 */
export function calculateGroupTotal(accounts: Account[]): number {
  return accounts.reduce((sum, account) => {
    return sum + parseFloat(account.balance);
  }, 0);
}

export type GroupTotal = {
  group: AccountGroupType;
  total: number;
  count: number;
  isLiability: boolean;
};

export function calculateGroupTotals(accounts: Account[]): GroupTotal[] {
  const map = new Map<AccountGroupType, { total: number; count: number }>();

  accounts.forEach((account) => {
    if (!account.isActive) return;
    const entry = map.get(account.group) ?? { total: 0, count: 0 };
    entry.total += parseFloat(account.balance);
    entry.count += 1;
    map.set(account.group, entry);
  });

  return Array.from(map.entries()).map(([group, { total, count }]) => ({
    group,
    total,
    count,
    isLiability: ACCOUNT_GROUP_METADATA[group].isLiability,
  }));
}

const CASH_GROUPS: AccountGroupType[] = ["chequing", "savings", "cash"];

export function calculateCashOnHand(accounts: Account[]): number {
  return accounts.reduce((sum, account) => {
    if (!account.isActive) return sum;
    if (!CASH_GROUPS.includes(account.group)) return sum;
    return sum + parseFloat(account.balance);
  }, 0);
}
