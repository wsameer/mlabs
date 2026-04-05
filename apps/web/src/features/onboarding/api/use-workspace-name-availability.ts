import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  CheckWorkspaceNameAvailabilityResult,
  WorkspaceName,
} from "@workspace/types";

export const onboardingKeys = {
  all: ["onboarding"] as const,
  workspaceNameAvailability: (name: string) =>
    [...onboardingKeys.all, "workspace-name-availability", name] as const,
};

export function useWorkspaceNameAvailability(name: string, enabled: boolean) {
  return useQuery({
    queryKey: onboardingKeys.workspaceNameAvailability(name),
    queryFn: ({ signal }) =>
      apiClient<CheckWorkspaceNameAvailabilityResult>(
        "/profiles/name-availability",
        {
          params: { name: name as WorkspaceName },
          signal,
          includeProfileId: false,
        }
      ),
    enabled,
  });
}
