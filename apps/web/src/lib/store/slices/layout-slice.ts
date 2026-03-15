import type { StateCreator } from "zustand";
import type { AppStoreState } from "../store";

export type LayoutSlice = {
  // Header
  headerTitle: string;
  headerActions: React.ReactNode | null;
  /** Path for mobile back button. When set, shows back arrow on mobile header */
  mobileBackPath: string | null;

  // Sidebars (consolidated from ui-store + layout-store)
  sidebarLeftContent: React.ReactNode | null;

  // Actions
  setHeaderTitle: (title: string) => void;
  setHeaderActions: (actions: React.ReactNode | null) => void;
  setMobileBackPath: (path: string | null) => void;
  setSidebarLeftContent: (content: React.ReactNode | null) => void;
  resetLayout: () => void;
};

// ============================================================================
// SLICE CREATOR
// ============================================================================

export const createLayoutSlice: StateCreator<
  AppStoreState,
  [["zustand/immer", never]],
  [],
  LayoutSlice
> = (set) => ({
  // Initial state
  headerTitle: "Dashboard",
  headerActions: null,
  mobileBackPath: null,
  sidebarLeftContent: null,

  // Actions
  setHeaderTitle: (title) =>
    set((state) => {
      state.headerTitle = title;
    }),

  setHeaderActions: (actions) =>
    set((state) => {
      state.headerActions = actions;
    }),

  setMobileBackPath: (path) =>
    set((state) => {
      state.mobileBackPath = path;
    }),

  setSidebarLeftContent: (content) =>
    set((state) => {
      state.sidebarLeftContent = content;
    }),

  resetLayout: () =>
    set((state) => {
      state.headerTitle = "Dashboard";
      state.headerActions = null;
      state.mobileBackPath = null;
      state.sidebarLeftContent = null;
    }),
});
