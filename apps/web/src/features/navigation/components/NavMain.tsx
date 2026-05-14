import { Link, useRouterState } from "@tanstack/react-router";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar";

import { PRIMARY_NAVIGATION_OPTIONS } from "@/features/navigation/constants";
import { useBackendStatus } from "@/hooks/use-app";

export function NavMain() {
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
    <SidebarGroup>
      <SidebarGroupLabel>Main</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarGroupContent className="px-1.5 md:px-0">
          {PRIMARY_NAVIGATION_OPTIONS.map((item) => (
            <SidebarMenuItem key={item.title} className="mb-1">
              <SidebarMenuButton
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
        </SidebarGroupContent>
      </SidebarMenu>
    </SidebarGroup>
  );
}
