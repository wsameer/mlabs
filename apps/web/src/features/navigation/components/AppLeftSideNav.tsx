import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar";

import {
  PRIMARY_NAVIGATION_OPTIONS,
  SECONDARY_NAV_OPTIONS,
} from "@/features/navigation/constants";
import { useBackendStatus } from "@/hooks/use-app";

import { TeamSwitcher } from "./TeamSwitcher";

export function AppLeftSideNav({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile, isMobile } = useSidebar();
  const router = useRouterState();
  const backendStatus = useBackendStatus();
  const isBackendConnected = backendStatus === "connected";

  const currentPath = router.location.pathname;

  const handleNavClick = (path: string) => {
    if (!isBackendConnected) return;

    // Store return path when navigating to settings
    if (path.startsWith("/settings") && !currentPath.startsWith("/settings")) {
      sessionStorage.setItem("settings-return-path", currentPath);
    }

    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    /* This is the first sidebar */
    /* We disable collapsible and adjust width to icon. */
    /* This will make the sidebar appear as icons. */
    <Sidebar
      collapsible="none"
      className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r py-1"
      {...props}
    >
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-1.5 md:px-0">
            <SidebarMenu className="gap-2">
              {PRIMARY_NAVIGATION_OPTIONS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={{
                      children: item.title,
                      hidden: false,
                    }}
                    render={
                      <Link
                        to={item.path}
                        onClick={() => handleNavClick(item.path)}
                      />
                    }
                    isActive={currentPath === item.path}
                    className="px-2.5 md:px-2"
                    disabled={!isBackendConnected}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenu className="gap-2">
            {SECONDARY_NAV_OPTIONS.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={{
                    children: item.title,
                    hidden: false,
                  }}
                  className="px-2.5 md:px-2"
                  disabled={!isBackendConnected}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
