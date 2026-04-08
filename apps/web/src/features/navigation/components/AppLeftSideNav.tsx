import {
  ChevronsUpDown,
  PersonStandingIcon,
  Plus,
  PlusIcon,
  WalletMinimalIcon,
} from "lucide-react";
import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";

import {
  PRIMARY_NAVIGATION_OPTIONS,
  SECONDARY_NAV_OPTIONS,
} from "@/features/navigation/constants";
import { useUiActions } from "@/hooks/use-ui-store";
import {
  useAppProfile,
  useAppProfiles,
  useBackendStatus,
} from "@/hooks/use-app";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";

function TeamSwitcher() {
  const activeProfile = useAppProfile();
  const allProfiles = useAppProfiles();

  if (!activeProfile) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="md:h-8 md:p-0">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <WalletMinimalIcon className="size-4" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" className="md:h-8 md:p-0" />}
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <WalletMinimalIcon className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {activeProfile?.name}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={"bottom"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Other profiles
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            {allProfiles.map((profile, index) => (
              <DropdownMenuItem
                key={profile.id}
                className="gap-2 p-2"
                disabled={activeProfile.id === profile.id}
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <PersonStandingIcon className="size-3.5 shrink-0" />
                </div>
                {profile.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppLeftSideNav({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile, isMobile } = useSidebar();
  const { setOpenCreateTransaction } = useUiActions();
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
            <SidebarMenuItem className="mb-2">
              <SidebarMenuButton
                className={cn(
                  "rounded-full bg-primary/80 px-2.5 text-secondary md:px-2",
                  {
                    "bg-muted": !isBackendConnected,
                    "hover:bg-primary hover:text-white active:bg-primary":
                      isBackendConnected,
                  }
                )}
                variant="outline"
                aria-label="Add transaction"
                onClick={() =>
                  isBackendConnected && setOpenCreateTransaction(true)
                }
                tooltip={{
                  children: "Add new transaction",
                  hidden: false,
                }}
                disabled={!isBackendConnected}
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
