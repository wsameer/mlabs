import type { AppStoreState } from "@/stores/app-store";
import {
  apiClient,
  clearProfileId,
  getProfileId,
  setProfileId,
} from "@/lib/api-client";
import type {
  BackendStatus,
  Bootstrap,
  HealthCheck,
  Profile,
} from "@workspace/types";

import type { StateCreator } from "zustand";

export type AppStatus = "onboarding" | "pick" | "ready" | null;

export type AppSlice = {
  backendStatus: BackendStatus;
  backendHealth: HealthCheck | null;
  appStatus: AppStatus;
  appProfile: Profile | null;
  appProfiles: Profile[];
  isAppLoading: boolean;
  appError: string | null;
  setBackendStatus: (status: BackendStatus) => void;
  setBackendHealth: (health: HealthCheck | null) => void;
  completeOnboarding: (profile: Profile) => void;
  fetchAppData: () => Promise<Bootstrap>;
};

export const createAppSlice: StateCreator<
  AppStoreState,
  [["zustand/immer", never]],
  [],
  AppSlice
> = (set) => ({
  backendStatus: "checking",
  backendHealth: null,
  appStatus: null,
  appProfile: null,
  appProfiles: [],
  isAppLoading: false,
  appError: null,

  setBackendStatus: (status) =>
    set((state) => {
      state.backendStatus = status;
    }),

  setBackendHealth: (health) =>
    set((state) => {
      state.backendHealth = health;
    }),

  completeOnboarding: (profile) => {
    setProfileId(profile.id);
    set((state) => {
      state.appStatus = "ready";
      state.appProfile = profile;
      state.appProfiles = [profile];
      state.isAppLoading = false;
      state.appError = null;
    });
  },

  fetchAppData: async () => {
    set((state) => {
      state.isAppLoading = true;
      state.appError = null;
    });

    try {
      const data = await apiClient<Bootstrap>("/bootstrap", {
        includeProfileId: false,
      });

      const currentProfileId = getProfileId();

      if (data.status === "ready" && data.profile) {
        setProfileId(data.profile.id);
      } else if (
        data.status === "onboarding" ||
        (currentProfileId &&
          !data.profiles.some((profile) => profile.id === currentProfileId))
      ) {
        clearProfileId();
      }

      set((state) => {
        state.appStatus = data.status;
        state.appProfile = data.profile ?? null;
        state.appProfiles = data.profiles;
        state.isAppLoading = false;
        state.appError = null;
      });

      return data;
    } catch (error) {
      set((state) => {
        state.isAppLoading = false;
        state.appError =
          error instanceof Error ? error.message : "Failed to load app data";
      });

      throw error;
    }
  },
});
