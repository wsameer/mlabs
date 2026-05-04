import type { ApiResponse } from "@workspace/types";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  includeProfileId?: boolean;
};

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, params, signal, includeProfileId = true } =
    options;

  const apiBase = import.meta.env.VITE_API_URL ?? window.location.origin;
  const url = new URL(`/api${path}`, apiBase);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null)
        url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (includeProfileId) {
    const currentProfileId = getProfileId();
    if (currentProfileId) {
      headers["X-Profile-Id"] = currentProfileId;
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error?.error?.message ?? `Request failed: ${response.status}`,
      response.status,
      error?.error?.code
    );
  }

  const json: ApiResponse<T> = await response.json();
  if (!json.success) {
    throw new ApiError(json.error?.message ?? "Unknown error", response.status);
  }
  return json.data as T;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// Convert an object with mixed value types to string params for URL search params
export function toQueryParams(
  obj?: Record<string, unknown>
): Record<string, string | undefined> | undefined {
  if (!obj) return undefined;
  const result: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] =
      value !== undefined && value !== null ? String(value) : undefined;
  }
  return result;
}

/**
 * @todo - move this to its own file
 */
// Profile ID management (simple localStorage for now)
let profileId: string | null = null;

export function setProfileId(id: string) {
  profileId = id;
  localStorage.setItem("mlabs-profile-id", id);
}

export function clearProfileId() {
  profileId = null;
  localStorage.removeItem("mlabs-profile-id");
}

export function getProfileId(): string {
  if (!profileId) {
    profileId = localStorage.getItem("mlabs-profile-id") ?? "";
  }
  return profileId;
}
