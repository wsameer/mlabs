import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/stores";
import type { Profile, UpdateProfile } from "@workspace/types";

export const profileSettingsKeys = {
  all: ["profile-settings"] as const,
  details: () => [...profileSettingsKeys.all, "detail"] as const,
  detail: (id: string) => [...profileSettingsKeys.details(), id] as const,
};

export function useProfileSettings(profileId: string) {
  const appProfile = useAppStore((state) => state.appProfile);
  const syncAppProfile = useAppStore((state) => state.syncAppProfile);

  const query = useQuery({
    queryKey: profileSettingsKeys.detail(profileId),
    queryFn: ({ signal }) =>
      apiClient<Profile>(`/profiles/${profileId}`, {
        signal,
        includeProfileId: false,
      }),
    enabled: profileId.length > 0,
    initialData: appProfile?.id === profileId ? appProfile : undefined,
  });

  useEffect(() => {
    if (query.data) {
      syncAppProfile(query.data);
    }
  }, [query.data, syncAppProfile]);

  return query;
}

export function useUpdateProfileSettings(profileId: string) {
  const queryClient = useQueryClient();
  const syncAppProfile = useAppStore((state) => state.syncAppProfile);

  return useMutation({
    mutationFn: (data: UpdateProfile) =>
      apiClient<Profile>(`/profiles/${profileId}`, {
        method: "PUT",
        body: data,
        includeProfileId: false,
      }),
    onSuccess: (profile) => {
      syncAppProfile(profile);
      queryClient.setQueryData(profileSettingsKeys.detail(profileId), profile);
      queryClient.invalidateQueries({
        queryKey: profileSettingsKeys.detail(profileId),
      });
    },
  });
}
