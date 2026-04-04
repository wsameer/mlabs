import { useQuery } from "@tanstack/react-query";

import type { HealthCheck } from "@workspace/types";

import { apiClient } from "@/lib/api-client";

export const healthKeys = {
  all: ["health"] as const,
};

export function useHealthCheck() {
  return useQuery({
    queryKey: healthKeys.all,
    queryFn: () => apiClient<HealthCheck>("/health"),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: Infinity, // treat as resolved for the session lifetime
  });
}
