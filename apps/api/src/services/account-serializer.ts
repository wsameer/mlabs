import { accounts } from "@workspace/db";
import type { Account } from "@workspace/types";

export function serializeAccount(
  account: typeof accounts.$inferSelect
): Account {
  return {
    ...account,
    originalAmount: account.originalAmount ?? undefined,
    interestRate: account.interestRate ?? undefined,
    nextPaymentDate: account.nextPaymentDate ?? undefined,
    linkedAccountId: account.linkedAccountId ?? undefined,
    color: account.color ?? undefined,
    icon: account.icon ?? undefined,
    notes: account.notes ?? undefined,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}
