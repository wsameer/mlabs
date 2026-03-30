import { useAppStore } from "@/stores";
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

  // Use ref to capture latest config without triggering re-execution.
  // config.actions and config.leftSidebarContent are React nodes (new refs every render).
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const cfg = configRef.current;
    if (cfg.pageTitle !== undefined) setHeaderTitle(cfg.pageTitle);
    if (cfg.actions !== undefined) setHeaderActions(cfg.actions);
    if (cfg.mobileBackPath !== undefined) setMobileBackPath(cfg.mobileBackPath);
    if (cfg.leftSidebarContent !== undefined)
      setLeftSidebarContent(cfg.leftSidebarContent);

    return () => {
      resetLayout();
    };
    // Zustand selectors are stable refs — safe to include. Config read via ref.
  }, [
    setHeaderTitle,
    setHeaderActions,
    setMobileBackPath,
    setLeftSidebarContent,
    resetLayout,
  ]);
}
