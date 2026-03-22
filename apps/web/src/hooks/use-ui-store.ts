import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@/lib/store";
import {
  globalLoadingSelector,
  globalSearchSelector,
  openCreateAccountSelector,
  openCreateTransactionSelector,
  transactionDateSelector,
  transactionTypeSelector,
} from "@/lib/store/selectors/ui-selectors";

export const useGlobalLoading = () => useAppStore(globalLoadingSelector);
export const useGlobalSearch = () => useAppStore(globalSearchSelector);
export const useOpenCreateAccount = () =>
  useAppStore(openCreateAccountSelector);
export const useOpenCreateTransaction = () =>
  useAppStore(openCreateTransactionSelector);
export const useTransactionDate = () => useAppStore(transactionDateSelector);
export const useTransactionType = () => useAppStore(transactionTypeSelector);

// Include actions too — actions don't need selectors since they're stable references
export const useUiActions = () =>
  useAppStore(
    useShallow((state) => ({
      setGlobalLoading: state.setGlobalLoading,
      setGlobalSearch: state.setGlobalSearch,
      setOpenCreateAccount: state.setOpenCreateAccount,
      setOpenCreateTransaction: state.setOpenCreateTransaction,
      setTransactionDate: state.setTransactionDate,
      setTransactionType: state.setTransactionType,
    }))
  );
