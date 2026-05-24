import { useState, useCallback } from "react";
import { apiClient, toQueryParams } from "@/lib/api-client";
import type { Transaction } from "@workspace/types";

const PAGE_SIZE = 100;

type ListResponse = { transactions: Transaction[]; total: number };

async function fetchAllTransactions(
  accountId: string,
  signal?: AbortSignal
): Promise<Transaction[]> {
  const all: Transaction[] = [];
  let offset = 0;

  while (true) {
    const page = await apiClient<ListResponse>("/transactions", {
      params: toQueryParams({
        accountId,
        limit: PAGE_SIZE,
        offset,
        sortBy: "date",
        sortOrder: "asc",
      }),
      signal,
    });

    all.push(...page.transactions);

    if (page.transactions.length < PAGE_SIZE || all.length >= page.total) {
      return all;
    }
    offset += PAGE_SIZE;
  }
}

export function useExportTransactions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (accountId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await fetchAllTransactions(accountId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch transactions";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchAll, isLoading, error };
}
