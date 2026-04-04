import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import {
  DASHBOARD_ROUTE,
  ONBOARDING_ROUTE,
  PROFILES_ROUTE,
} from "@/constants";
import { useAppStore } from "@/stores";

export function BootstrapRedirect() {
  const navigate = useNavigate();
  const appStatus = useAppStore((state) => state.appStatus);

  useEffect(() => {
    if (!appStatus) return;

    const nextRoute =
      appStatus === "onboarding"
        ? ONBOARDING_ROUTE
        : appStatus === "pick"
          ? PROFILES_ROUTE
          : DASHBOARD_ROUTE;

    void navigate({ to: nextRoute, replace: true });
  }, [navigate, appStatus]);

  return null;
}
