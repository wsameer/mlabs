import { useSearch } from "@tanstack/react-router";
import { useAccounts } from "@/features/accounts/api/use-accounts";
import type { TransactionFilterState } from "../filters";

/**
 * Returns the account id the transactions page is currently scoped to,
 * or undefined when not on a scoped transactions view (or the scoped
 * account is missing/inactive). Lets the create-transaction form
 * pre-select the account the user was just looking at.
 */
export function useScopedAccountId(): string | undefined {
  const search = useSearch({
    strict: false,
  }) as Partial<TransactionFilterState>;
  const candidate = search.accountIds?.[0];
  const { data: accounts } = useAccounts({ isActive: true });

  if (!candidate) return undefined;
  if (!accounts) return undefined;

  return accounts.some((a) => a.id === candidate) ? candidate : undefined;
}
