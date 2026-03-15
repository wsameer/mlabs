import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@/lib/store";
import {
  globalLoadingSelector,
  globalSearchSelector,
} from "@/lib/store/selectors/ui.selectors";

export const useGlobalLoading = () => useAppStore(globalLoadingSelector);
export const useGlobalSearch = () => useAppStore(globalSearchSelector);

// Include actions too — actions don't need selectors since they're stable references
export const useUiActions = () =>
  useAppStore(
    useShallow((state) => ({
      setGlobalLoading: state.setGlobalLoading,
      setGlobalSearch: state.setGlobalSearch,
    }))
  );
