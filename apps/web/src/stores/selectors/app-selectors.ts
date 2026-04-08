import type { AppStoreState } from "@/stores/app-store";

// Backend Status Selectors
export const backendStatusSelector = (state: AppStoreState) =>
  state.backendStatus;
export const backendHealthSelector = (state: AppStoreState) =>
  state.backendHealth;

// App Status Selectors
export const appStatusSelector = (state: AppStoreState) => state.appStatus;
export const isAppLoadingSelector = (state: AppStoreState) =>
  state.isAppLoading;
export const appErrorSelector = (state: AppStoreState) => state.appError;

// Profile Selectors
export const appProfileSelector = (state: AppStoreState) => state.appProfile;
export const appProfilesSelector = (state: AppStoreState) => state.appProfiles;
export const hasAccountSelector = (state: AppStoreState) => state.hasAccount;
