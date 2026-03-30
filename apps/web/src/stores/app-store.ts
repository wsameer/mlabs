/* eslint-disable @typescript-eslint/no-explicit-any -- this file is an exception */
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { DEFAULT_GRAIN } from "@/constants";

import { getDefaultRange } from "@/lib/get-default-range";
import { createFiltersSlice, type FiltersSlice } from "./slices/filters-slice";
import { createLayoutSlice, type LayoutSlice } from "./slices/layout-slice";
import { createUiSlice, type UiSlice } from "./slices/ui-slice";

// COMBINED STORE TYPE
export type AppStoreState = LayoutSlice & UiSlice & FiltersSlice;

// STORE CREATION
export const useAppStore = create<AppStoreState>()(
  devtools(
    persist(
      immer((...args) => ({
        ...createLayoutSlice(...args),
        ...createUiSlice(...args),
        ...createFiltersSlice(...args),
      })),
      {
        name: "mlabs-state-storage",
        partialize: (state) => ({
          timeGrain: state.timeGrain,
          dateRange: state.dateRange,
          transactionType: state.transactionType,
        }),
        // Revive Date strings back to Date objects
        merge: (persisted: any, current) => ({
          ...current,
          ...persisted,
          dateRange: persisted?.dateRange?.from
            ? {
                from: new Date(persisted.dateRange.from),
                to: new Date(persisted.dateRange.to),
              }
            : getDefaultRange(persisted?.timeGrain ?? DEFAULT_GRAIN),
        }),
      }
    ),
    { name: "app-store", enabled: import.meta.env.DEV }
  )
);
