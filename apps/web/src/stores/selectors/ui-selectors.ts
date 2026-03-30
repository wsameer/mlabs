import type { AppStoreState } from "@/stores/app-store";

export const globalLoadingSelector = (state: AppStoreState) =>
  state.globalLoading;
export const globalSearchSelector = (state: AppStoreState) =>
  state.globalSearch;
export const openCreateAccountSelector = (state: AppStoreState) =>
  state.openCreateAccount;
export const openCreateTransactionSelector = (state: AppStoreState) =>
  state.openCreateTransaction;
export const transactionDateSelector = (state: AppStoreState) =>
  state.transactionDate;
export const transactionTypeSelector = (state: AppStoreState) =>
  state.transactionType;
