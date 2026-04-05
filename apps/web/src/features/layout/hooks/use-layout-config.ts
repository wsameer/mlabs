import { useAppStore } from "@/stores";
import { useEffect } from "react";

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

  useEffect(() => {
    if (config.pageTitle !== undefined) setHeaderTitle(config.pageTitle);
  }, [config.pageTitle, setHeaderTitle]);

  useEffect(() => {
    if (config.actions !== undefined) setHeaderActions(config.actions);
  }, [config.actions, setHeaderActions]);

  useEffect(() => {
    if (config.mobileBackPath !== undefined)
      setMobileBackPath(config.mobileBackPath);
  }, [config.mobileBackPath, setMobileBackPath]);

  useEffect(() => {
    if (config.leftSidebarContent !== undefined)
      setLeftSidebarContent(config.leftSidebarContent);
  }, [config.leftSidebarContent, setLeftSidebarContent]);

  useEffect(() => {
    return () => {
      resetLayout();
    };
  }, [resetLayout]);
}
