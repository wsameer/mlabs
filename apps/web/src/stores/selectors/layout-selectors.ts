import type { AppStoreState } from "@/stores/app-store";

// Header Selectors
export const headerTitleSelector = (state: AppStoreState) => state.headerTitle;
export const headerActionsSelector = (state: AppStoreState) =>
  state.headerActions;
export const breadcrumbsSelector = (state: AppStoreState) => state.breadcrumbs;
export const mobileBackPathSelector = (state: AppStoreState) =>
  state.mobileBackPath;
export const onMobileBackSelector = (state: AppStoreState) =>
  state.onMobileBack;

// Sidebar Selectors
export const sidebarLeftContentSelector = (state: AppStoreState) =>
  state.sidebarLeftContent;
