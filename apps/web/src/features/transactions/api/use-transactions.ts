import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, toQueryParams } from "@/lib/api-client";
import type {
  Transaction,
  InsertTransaction,
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
      apiClient<Transaction[]>("/transactions", {
        params: toQueryParams(filters as Record<string, unknown>),
        signal,
      }),
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
    mutationFn: (data: InsertTransaction) =>
      apiClient<Transaction>("/transactions", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransaction }) =>
      apiClient<Transaction>(`/transactions/${id}`, {
        method: "PATCH",
        body: data,
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(id) });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<Transaction>(`/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
    },
  });
}
