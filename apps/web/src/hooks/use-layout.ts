import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@/stores";
import {
  headerTitleSelector,
  headerActionsSelector,
  mobileBackPathSelector,
  sidebarLeftContentSelector,
} from "@/stores/selectors/layout-selectors";

// Individual atomic selectors (use these by default)
export const useHeaderTitle = () => useAppStore(headerTitleSelector);
export const useHeaderActions = () => useAppStore(headerActionsSelector);
export const useMobileBackPath = () => useAppStore(mobileBackPathSelector);
export const useSidebarLeftContent = () =>
  useAppStore(sidebarLeftContentSelector);

// Grouped selectors (use only when consuming multiple values together)
export const useHeaderConfig = () =>
  useAppStore(
    useShallow((state) => ({
      title: state.headerTitle,
      actions: state.headerActions,
      mobileBackPath: state.mobileBackPath,
    }))
  );

// Actions (stable references, no re-renders)
export const useLayoutActions = () =>
  useAppStore(
    useShallow((state) => ({
      setHeaderTitle: state.setHeaderTitle,
      setHeaderActions: state.setHeaderActions,
      setMobileBackPath: state.setMobileBackPath,
      setSidebarLeftContent: state.setSidebarLeftContent,
      resetLayout: state.resetLayout,
    }))
  );
