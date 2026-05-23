import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { useAppProfile, useAppProfiles } from "@/hooks/use-app";
import { setProfileId } from "@/lib/api-client";
import { useAppStore } from "@/stores";
import { DASHBOARD_ROUTE, PROFILES_ROUTE } from "@/constants";
import type { Profile } from "@workspace/types";

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
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
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function ProfileAvatar({
  profile,
  size = "sm",
}: {
  profile: Profile;
  size?: "sm" | "default";
}) {
  return (
    <Avatar size={size} className="rounded-md">
      <AvatarFallback className="rounded-md bg-primary/10 font-medium text-primary">
        {getInitials(profile.name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function TeamSwitcher() {
  const navigate = useNavigate();
  const activeProfile = useAppProfile();
  const allProfiles = useAppProfiles();
  const fetchAppData = useAppStore((state) => state.fetchAppData);

  if (!activeProfile) {
    return null;
  }

  async function handleSwitch(profileId: string) {
    if (!activeProfile || profileId === activeProfile.id) return;
    setProfileId(profileId);
    await fetchAppData();
    await navigate({ to: DASHBOARD_ROUTE, replace: true });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                aria-label={`Workspace: ${activeProfile.name}`}
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-olive-700 text-sidebar-primary-foreground">
              <img
                src="/mlabs-icon.png"
                alt="mlabs"
                className="size-6 object-contain"
              />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">mLabs</span>
              <span className="truncate text-xs">{activeProfile.name}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            align="start"
            side="right"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Workspaces
              </DropdownMenuLabel>
              {allProfiles.map((profile) => (
                <DropdownMenuItem
                  key={profile.id}
                  className="gap-2.5 p-2"
                  onClick={() => void handleSwitch(profile.id)}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <ProfileAvatar profile={profile} size="sm" />
                  </div>
                  <span className="flex-1 truncate text-xs">
                    {profile.name}
                  </span>
                  {profile.id === activeProfile.id && (
                    <DropdownMenuShortcut>
                      <CheckIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    </DropdownMenuShortcut>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => void navigate({ to: PROFILES_ROUTE })}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <PlusIcon className="size-4" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Add workspace
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
