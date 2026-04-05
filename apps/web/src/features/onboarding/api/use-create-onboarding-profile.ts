import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreateOnboardingProfile, Profile } from "@workspace/types";

export function useCreateOnboardingProfile() {
  return useMutation({
    mutationFn: (data: CreateOnboardingProfile) =>
      apiClient<Profile>("/profiles", {
        method: "POST",
        body: data,
        includeProfileId: false,
      }),
  });
}
