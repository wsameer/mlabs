import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@/stores";
import {
  backendStatusSelector,
  backendHealthSelector,
  appStatusSelector,
  isAppLoadingSelector,
  appErrorSelector,
  appProfileSelector,
  appProfilesSelector,
  hasAccountSelector,
} from "@/stores/selectors/app-selectors";

// Individual atomic selectors (use these by default)
export const useBackendStatus = () => useAppStore(backendStatusSelector);
export const useBackendHealth = () => useAppStore(backendHealthSelector);
export const useAppStatus = () => useAppStore(appStatusSelector);
export const useIsAppLoading = () => useAppStore(isAppLoadingSelector);
export const useAppError = () => useAppStore(appErrorSelector);
export const useAppProfile = () => useAppStore(appProfileSelector);
export const useAppProfiles = () => useAppStore(appProfilesSelector);
export const useHasAccount = () => useAppStore(hasAccountSelector);

// Grouped selectors (use only when consuming multiple values together)
export const useAppProfileData = () =>
  useAppStore(
    useShallow((state) => ({
      profile: state.appProfile,
      profiles: state.appProfiles,
      hasAccount: state.hasAccount,
    }))
  );

export const useAppLoadingState = () =>
  useAppStore(
    useShallow((state) => ({
      isLoading: state.isAppLoading,
      error: state.appError,
    }))
  );

// Actions (stable references, no re-renders)
export const useAppActions = () =>
  useAppStore(
    useShallow((state) => ({
      setBackendStatus: state.setBackendStatus,
      setBackendHealth: state.setBackendHealth,
      setHasAccount: state.setHasAccount,
      syncAppProfile: state.syncAppProfile,
      completeOnboarding: state.completeOnboarding,
      fetchAppData: state.fetchAppData,
    }))
  );
