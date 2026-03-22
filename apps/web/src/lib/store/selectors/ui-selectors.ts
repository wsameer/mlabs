import type { AppStoreState } from "@/lib/store/store";

export const globalLoadingSelector = (state: AppStoreState) =>
  state.globalLoading;
export const globalSearchSelector = (state: AppStoreState) =>
  state.globalSearch;
export const openCreateAccountSelector = (state: AppStoreState) =>
  state.openCreateAccount;
export const openCreateTransactionSelector = (state: AppStoreState) =>
  state.openCreateTransaction;
