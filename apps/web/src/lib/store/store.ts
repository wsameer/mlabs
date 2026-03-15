import {
  createLayoutSlice,
  type LayoutSlice,
} from "@/lib/store/slices/layout-slice";
import { createUiSlice, type UiSlice } from "@/lib/store/slices/ui-slice";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// COMBINED STORE TYPE
export type AppStoreState = LayoutSlice & UiSlice;

// STORE CREATION
export const useAppStore = create<AppStoreState>()(
  devtools(
    persist(
      immer((...args) => ({
        ...createLayoutSlice(...args),
        ...createUiSlice(...args),
      })),
      {
        name: "app-storage",
        partialize: () => ({
          // Only persist what's needed
        }),
      }
    ),
    { name: "app-store", enabled: import.meta.env.DEV }
  )
);
