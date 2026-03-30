import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, toQueryParams } from "@/lib/api-client";
import type {
  Account,
  InsertAccount,
  UpdateAccount,
  AccountQuery,
} from "@workspace/types";

export const accountKeys = {
  all: ["accounts"] as const,
  lists: () => [...accountKeys.all, "list"] as const,
  list: (filters?: AccountQuery) => [...accountKeys.lists(), filters] as const,
  details: () => [...accountKeys.all, "detail"] as const,
  detail: (id: string) => [...accountKeys.details(), id] as const,
};

export function useAccounts(filters?: AccountQuery) {
  return useQuery({
    queryKey: accountKeys.list(filters),
    queryFn: ({ signal }) =>
      apiClient<Account[]>("/accounts", {
        params: toQueryParams(filters as Record<string, unknown>),
        signal,
      }),
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: ({ signal }) => apiClient<Account>(`/accounts/${id}`, { signal }),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertAccount) =>
      apiClient<Account>("/accounts", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccount }) =>
      apiClient<Account>(`/accounts/${id}`, { method: "PATCH", body: data }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(id) });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<Account>(`/accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
    },
  });
}
