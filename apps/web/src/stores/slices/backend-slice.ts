import type { AppStoreState } from "@/stores/app-store";
import type { HealthCheck } from "@workspace/types";

import type { StateCreator } from "zustand";

export type BackendStatus = "connected" | "disconnected" | "checking";

export type BackendSlice = {
  backendStatus: BackendStatus;
  backendHealth: HealthCheck | null;
  setBackendStatus: (status: BackendStatus) => void;
  setBackendHealth: (health: HealthCheck | null) => void;
};

export const createBackendSlice: StateCreator<
  AppStoreState,
  [["zustand/immer", never]],
  [],
  BackendSlice
> = (set) => ({
  backendStatus: "checking",
  backendHealth: null,

  setBackendStatus: (status) =>
    set((state) => {
      state.backendStatus = status;
    }),

  setBackendHealth: (health) =>
    set((state) => {
      state.backendHealth = health;
    }),
});
