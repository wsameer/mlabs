import { useEffect } from "react";
import { useLayoutActions } from "@/hooks/use-layout";
import type { Breadcrumb } from "@/stores/slices/layout-slice";

type LayoutConfig = {
  pageTitle?: string;
  actions?: React.ReactNode;
  /** Desktop-only crumbs. When present, the desktop header renders these instead of pageTitle. */
  breadcrumbs?: Breadcrumb[] | null;
  mobileBackPath?: string | null;
  onMobileBack?: (() => void) | null;
  leftSidebarContent?: React.ReactNode;
};

export function useLayoutConfig(config: LayoutConfig) {
  const {
    setHeaderTitle,
    setHeaderActions,
    setBreadcrumbs,
    setMobileBackPath,
    setOnMobileBack,
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
    if (config.breadcrumbs !== undefined) setBreadcrumbs(config.breadcrumbs);
  }, [config.breadcrumbs, setBreadcrumbs]);

  useEffect(() => {
    if (config.mobileBackPath !== undefined)
      setMobileBackPath(config.mobileBackPath);
  }, [config.mobileBackPath, setMobileBackPath]);

  useEffect(() => {
    if (config.onMobileBack !== undefined) setOnMobileBack(config.onMobileBack);
  }, [config.onMobileBack, setOnMobileBack]);

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
