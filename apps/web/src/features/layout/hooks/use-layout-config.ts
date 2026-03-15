import { useAppStore } from "@/lib/store";
import { useEffect, useRef } from "react";

type LayoutConfig = {
  pageTitle?: string;
  actions?: React.ReactNode;
  mobileBackPath?: string | null;
  leftSidebarContent?: React.ReactNode;
};

export function useLayoutConfig(config: LayoutConfig) {
  const setHeaderTitle = useAppStore((state) => state.setHeaderTitle);
  const setHeaderActions = useAppStore((state) => state.setHeaderActions);
  const setMobileBackPath = useAppStore((state) => state.setMobileBackPath);
  const setLeftSidebarContent = useAppStore(
    (state) => state.setSidebarLeftContent
  );

  const resetLayout = useAppStore((state) => state.resetLayout);

  const isInitialMount = useRef(true);

  useEffect(() => {
    // Set initial config
    if (config.pageTitle !== undefined) setHeaderTitle(config.pageTitle);
    if (config.actions !== undefined) setHeaderActions(config.actions);
    if (config.mobileBackPath !== undefined)
      setMobileBackPath(config.mobileBackPath);
    if (config.leftSidebarContent !== undefined)
      setLeftSidebarContent(config.leftSidebarContent);

    isInitialMount.current = false;

    // Cleanup on unmount - reset to defaults
    return () => {
      resetLayout();
    };
  }, [
    setHeaderTitle,
    setHeaderActions,
    setMobileBackPath,
    setLeftSidebarContent,
    resetLayout,
    config.pageTitle,
    config.actions,
    config.mobileBackPath,
    config.leftSidebarContent,
  ]);
}
