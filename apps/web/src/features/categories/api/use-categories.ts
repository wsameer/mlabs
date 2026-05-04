import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, toQueryParams } from "@/lib/api-client";
import type {
  Category,
  CategoryWithSubcategories,
  CreateCategory,
  UpdateCategory,
  CategoryQuery,
} from "@workspace/types";

export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (filters?: CategoryQuery) =>
    [...categoryKeys.lists(), filters] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};

export function useCategories(filters?: CategoryQuery) {
  return useQuery({
    queryKey: categoryKeys.list(filters),
    queryFn: ({ signal }) =>
      apiClient<CategoryWithSubcategories[]>("/categories", {
        params: toQueryParams(filters as Record<string, unknown>),
        signal,
      }),
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: ({ signal }) =>
      apiClient<Category>(`/categories/${id}`, { signal }),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategory) =>
      apiClient<Category>("/categories", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategory }) =>
      apiClient<Category>(`/categories/${id}`, { method: "PATCH", body: data }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<Category>(`/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}
