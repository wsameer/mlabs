import { CheckIcon, PlusIcon } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

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
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="cursor-pointer"
            aria-label={`Workspace: ${activeProfile.name}`}
          />
        }
      >
        <ProfileAvatar profile={activeProfile} size="sm" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="min-w-60 rounded-lg"
        align="end"
        side="bottom"
        sideOffset={6}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Workspaces
          </DropdownMenuLabel>
          {allProfiles.map((profile) => {
            const isActive = profile.id === activeProfile.id;
            return (
              <DropdownMenuItem
                key={profile.id}
                className="gap-2.5 p-2"
                onClick={() => void handleSwitch(profile.id)}
              >
                <ProfileAvatar profile={profile} size="sm" />
                <span className="flex-1 truncate text-sm">{profile.name}</span>
                {isActive && (
                  <CheckIcon className="size-3.5 shrink-0 text-muted-foreground" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="gap-2.5 p-2"
          onClick={() => void navigate({ to: PROFILES_ROUTE })}
        >
          <span
            aria-hidden
            className="grid size-6 place-items-center rounded-md border bg-background"
          >
            <PlusIcon className="size-3.5" />
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            Manage workspaces
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
