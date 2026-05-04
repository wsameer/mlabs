import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { DASHBOARD_ROUTE, ONBOARDING_ROUTE, PROFILES_ROUTE } from "@/constants";
import { ProfilePickerPage } from "@/features/profiles";
import { useAppStatus } from "@/hooks/use-app";

export const Route = createFileRoute(PROFILES_ROUTE)({
  component: ProfilesRoute,
});

function ProfilesRoute() {
  const navigate = useNavigate();
  const appStatus = useAppStatus();

  useEffect(() => {
    if (appStatus === "onboarding") {
      void navigate({ to: ONBOARDING_ROUTE, replace: true });
      return;
    }

    if (appStatus === "ready") {
      void navigate({ to: DASHBOARD_ROUTE, replace: true });
    }
  }, [navigate, appStatus]);

  if (appStatus !== "pick") {
    return null;
  }

  return <ProfilePickerPage />;
}
