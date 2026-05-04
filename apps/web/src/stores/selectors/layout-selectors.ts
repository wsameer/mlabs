import type { AppStoreState } from "@/stores/app-store";

// Header Selectors
export const headerTitleSelector = (state: AppStoreState) => state.headerTitle;
export const headerActionsSelector = (state: AppStoreState) =>
  state.headerActions;
export const mobileBackPathSelector = (state: AppStoreState) =>
  state.mobileBackPath;

// Sidebar Selectors
export const sidebarLeftContentSelector = (state: AppStoreState) =>
  state.sidebarLeftContent;
