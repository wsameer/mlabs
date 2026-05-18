import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

type ConfirmBody = { confirmName: string };

type OkResponse = { ok: true };

export function useDeleteWorkspace(profileId: string) {
  return useMutation({
    mutationFn: (body: ConfirmBody) =>
      apiClient<OkResponse>(`/profiles/${profileId}`, {
        method: "DELETE",
        body,
        includeProfileId: false,
      }),
  });
}

export function useClearTransactions(profileId: string) {
  return useMutation({
    mutationFn: (body: ConfirmBody) =>
      apiClient<OkResponse>(`/profiles/${profileId}/clear-transactions`, {
        method: "POST",
        body,
        includeProfileId: false,
      }),
  });
}

export function useFactoryReset(profileId: string) {
  return useMutation({
    mutationFn: (body: ConfirmBody) =>
      apiClient<OkResponse>(`/profiles/${profileId}/factory-reset`, {
        method: "POST",
        body,
        includeProfileId: false,
      }),
  });
}
