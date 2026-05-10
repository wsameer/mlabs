import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar";

import { PRIMARY_NAVIGATION_OPTIONS } from "@/features/navigation/constants";
import { useBackendStatus } from "@/hooks/use-app";

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

    if (path.startsWith("/settings") && !currentPath.startsWith("/settings")) {
      sessionStorage.setItem("settings-return-path", currentPath);
    }

    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar
      collapsible="none"
      className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r py-1"
      {...props}
    >
      <SidebarHeader className="flex items-center justify-center py-2">
        <div className="grid size-8 place-items-center rounded-lg bg-secondary text-primary-foreground shadow-sm">
          <img
            src="/mlabs-icon.png"
            alt="mlabs"
            className="size-6 object-contain"
          />
        </div>
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
    </Sidebar>
  );
}
