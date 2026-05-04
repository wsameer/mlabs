import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { apiClient, toQueryParams } from "@/lib/api-client";
import { accountKeys } from "@/features/accounts/api/use-accounts";
import type {
  Transaction,
  CreateTransaction,
  UpdateTransaction,
  TransactionQuery,
} from "@workspace/types";

export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (filters?: TransactionQuery) =>
    [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, "detail"] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
};

export function useTransactions(filters?: TransactionQuery) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: ({ signal }) =>
      apiClient<{ transactions: Transaction[]; total: number }>(
        "/transactions",
        {
          params: toQueryParams(filters as Record<string, unknown>),
          signal,
        }
      ),
    placeholderData: keepPreviousData,
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: ({ signal }) =>
      apiClient<Transaction>(`/transactions/${id}`, { signal }),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransaction) =>
      apiClient<Transaction | Transaction[]>("/transactions", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransaction }) =>
      apiClient<Transaction | Transaction[]>(`/transactions/${id}`, {
        method: "PATCH",
        body: data,
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<Transaction[]>(`/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
    },
  });
}

export function useTransferCounterLeg(
  transferId: string | null | undefined,
  selfId: string | null | undefined
) {
  return useQuery({
    queryKey: [...transactionKeys.all, "counter", transferId, selfId] as const,
    enabled: !!transferId && !!selfId,
    queryFn: async ({ signal }) => {
      const result = await apiClient<{
        transactions: Transaction[];
        total: number;
      }>("/transactions", {
        params: toQueryParams({ transferId: transferId! } as Record<
          string,
          unknown
        >),
        signal,
      });
      return result;
    },
    select: (result) => {
      const others = result.transactions.filter((t) => t.id !== selfId);
      if (result.transactions.length > 2) return "ambiguous" as const;
      return others[0] ?? null;
    },
  });
}

export function useMergeAsTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      counterAccountId,
    }: {
      id: string;
      counterAccountId?: string;
    }) =>
      apiClient<Transaction[]>(`/transactions/${id}/merge-as-transfer`, {
        method: "POST",
        body: { counterAccountId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
    },
  });
}
