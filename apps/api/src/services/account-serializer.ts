import { accounts } from "@workspace/db";
import type { Account } from "@workspace/types";

export function serializeAccount(
  account: typeof accounts.$inferSelect
): Account {
  return {
    ...account,
    institutionName: account.institutionName ?? undefined,
    accountNumber: account.accountNumber ?? undefined,
    description: account.description ?? undefined,
    originalAmount: account.originalAmount ?? undefined,
    interestRate: account.interestRate ?? undefined,
    creditLimit: account.creditLimit ?? undefined,
    linkedAccountId: account.linkedAccountId ?? undefined,
    metadata: (account.metadata as Record<string, unknown>) ?? undefined,
    color: account.color ?? undefined,
    icon: account.icon ?? undefined,
    notes: account.notes ?? undefined,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}
