import { PlusIcon, WalletMinimalIcon } from "lucide-react";
import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";

import {
  PRIMARY_NAVIGATION_OPTIONS,
  SECONDARY_NAV_OPTIONS,
} from "@/features/navigation/constants";
import { useUiActions } from "@/hooks/use-ui-store";

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

export function AppLeftSideNav({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile, isMobile } = useSidebar();
  const { setOpenCreateTransaction } = useUiActions();
  const router = useRouterState();

  const currentPath = router.location.pathname;

  const handleNavClick = (path: string) => {
    // Store return path when navigating to settings
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
      className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="md:h-8 md:p-0"
              render={<a href="#" />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <WalletMinimalIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">mLabs</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
            <SidebarMenuItem className="mb-2">
              <SidebarMenuButton
                className="rounded-full bg-primary/80 px-2.5 hover:bg-primary active:bg-primary md:px-2"
                variant="outline"
                aria-label="Add transaction"
                onClick={() => setOpenCreateTransaction(true)}
                tooltip={{
                  children: "Add new transaction",
                  hidden: false,
                }}
              >
                <PlusIcon />
                <span>Add transaction</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {SECONDARY_NAV_OPTIONS.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={{
                    children: item.title,
                    hidden: false,
                  }}
                  className="px-2.5 md:px-2"
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
