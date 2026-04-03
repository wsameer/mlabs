import type { AppStoreState } from "@/stores/app-store";
import type { TransactionType } from "@workspace/types";

import type { StateCreator } from "zustand";

export type UiSlice = {
  // State
  globalLoading: boolean;
  globalSearch: boolean;
  openCreateAccount: boolean;
  openCreateTransaction: boolean;
  transactionDate: Date;
  transactionType: TransactionType;

  // Actions
  setGlobalLoading: (loading: boolean) => void;
  setGlobalSearch: (searchVisible: boolean) => void;
  setOpenCreateAccount: (open: boolean) => void;
  setOpenCreateTransaction: (open: boolean) => void;
  setTransactionDate: (date: Date) => void;
  setTransactionType: (type: TransactionType) => void;
};

export const createUiSlice: StateCreator<
  AppStoreState,
  [["zustand/immer", never]],
  [],
  UiSlice
> = (set) => ({
  globalLoading: false,
  globalSearch: false,
  openCreateAccount: false,
  openCreateTransaction: false,
  transactionDate: new Date(),
  transactionType: "EXPENSE" as TransactionType,

  setGlobalLoading: (loading) =>
    set((state) => {
      state.globalLoading = loading;
    }),

  setGlobalSearch: (searchVisible) =>
    set((state) => {
      state.globalSearch = searchVisible;
    }),

  setOpenCreateAccount: (open) =>
    set((state) => {
      state.openCreateAccount = open;
    }),

  setOpenCreateTransaction: (open) =>
    set((state) => {
      state.openCreateTransaction = open;
    }),

  setTransactionDate: (date: Date) =>
    set((state) => {
      state.transactionDate = date;
    }),

  setTransactionType: (type: TransactionType) =>
    set((state) => {
      state.transactionType = type;
    }),
});
