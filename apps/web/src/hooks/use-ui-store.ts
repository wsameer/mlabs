import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@/lib/store";
import {
  globalLoadingSelector,
  globalSearchSelector,
  openCreateAccountSelector,
} from "@/lib/store/selectors/ui-selectors";

export const useGlobalLoading = () => useAppStore(globalLoadingSelector);
export const useGlobalSearch = () => useAppStore(globalSearchSelector);
export const useOpenCreateAccount = () =>
  useAppStore(openCreateAccountSelector);

// Include actions too — actions don't need selectors since they're stable references
export const useUiActions = () =>
  useAppStore(
    useShallow((state) => ({
      setGlobalLoading: state.setGlobalLoading,
      setGlobalSearch: state.setGlobalSearch,
      setOpenCreateAccount: state.setOpenCreateAccount,
    }))
  );
