import { useEffect } from "react";
import { useLayoutActions } from "@/hooks/use-layout";

type LayoutConfig = {
  pageTitle?: string;
  actions?: React.ReactNode;
  mobileBackPath?: string | null;
  leftSidebarContent?: React.ReactNode;
};

export function useLayoutConfig(config: LayoutConfig) {
  const {
    setHeaderTitle,
    setHeaderActions,
    setMobileBackPath,
    setSidebarLeftContent: setLeftSidebarContent,
    resetLayout,
  } = useLayoutActions();

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
