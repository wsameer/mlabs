/* eslint-disable @typescript-eslint/no-explicit-any -- this file is an exception */

import {
  createFiltersSlice,
  type FiltersSlice,
} from "@/lib/store/slices/filters-slice";
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
        // ...createFiltersSlice(...args),
      })),
      {
        name: "app-storage",
        partialize: (state) => ({
          // timeGrain: state.timeGrain,
          // dateRange: state.dateRange,
        }),
        // // Revive Date strings back to Date objects
        // merge: (persisted: any, current) => ({
        //   ...current,
        //   ...persisted,
        //   dateRange: {
        //     from: new Date(persisted.dateRange.from),
        //     to: new Date(persisted.dateRange.to),
        //   },
        // }),
      }
    ),
    { name: "app-store", enabled: import.meta.env.DEV }
  )
);
