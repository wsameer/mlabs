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
  hasAccount: boolean;
  isAppLoading: boolean;
  appError: string | null;
  setBackendStatus: (status: BackendStatus) => void;
  setBackendHealth: (health: HealthCheck | null) => void;
  setHasAccount: (value: boolean) => void;
  completeOnboarding: (profile: Profile, hasAccount: boolean) => void;
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
  hasAccount: false,
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

  setHasAccount: (value) =>
    set((state) => {
      state.hasAccount = value;
    }),

  completeOnboarding: (profile, hasAccount) => {
    setProfileId(profile.id);
    set((state) => {
      state.appStatus = "ready";
      state.appProfile = profile;
      state.appProfiles = [profile];
      state.hasAccount = hasAccount;
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
        state.hasAccount = data.hasAccount;
        state.isAppLoading = false;
        state.appError = null;
      });

      return data;
    } catch (error) {
      set((state) => {
        state.isAppLoading = false;
        state.hasAccount = false;
        state.appError =
          error instanceof Error ? error.message : "Failed to load app data";
      });

      throw error;
    }
  },
});
