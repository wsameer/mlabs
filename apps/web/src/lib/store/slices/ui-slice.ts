import type { AppStoreState } from "@/lib/store/store";
import type { StateCreator } from "zustand";

export type UiSlice = {
  // State
  globalLoading: boolean;
  globalSearch: boolean;

  // Actions
  setGlobalLoading: (loading: boolean) => void;
  setGlobalSearch: (searchVisible: boolean) => void;
};

export const createUiSlice: StateCreator<
  AppStoreState,
  [["zustand/immer", never]],
  [],
  UiSlice
> = (set) => ({
  globalLoading: false,
  globalSearch: false,

  setGlobalLoading: (loading) =>
    set((state) => {
      state.globalLoading = loading;
    }),

  setGlobalSearch: (searchVisible) =>
    set((state) => {
      state.globalSearch = searchVisible;
    }),
});
