import React, { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import {
  DASHBOARD_ROUTE,
  ONBOARDING_ROUTE,
  PROFILES_ROUTE,
} from "@/constants";
import { getProfileId } from "@/lib/api-client";
import { useAppStore } from "@/stores";

export function RequiresProfile({ children }: React.PropsWithChildren) {
  const navigate = useNavigate();
  const appStatus = useAppStore((state) => state.appStatus);

  useEffect(() => {
    if (appStatus === "onboarding") {
      void navigate({ to: ONBOARDING_ROUTE, replace: true });
      return;
    }

    if (appStatus === "pick" && !getProfileId()) {
      void navigate({ to: PROFILES_ROUTE, replace: true });
    }
  }, [navigate, appStatus]);

  if (appStatus === "onboarding") {
    return null;
  }

  if (appStatus === "pick" && !getProfileId()) {
    return null;
  }

  return <>{children}</>;
}

export function RequiresNoProfile({ children }: React.PropsWithChildren) {
  const navigate = useNavigate();
  const appStatus = useAppStore((state) => state.appStatus);

  useEffect(() => {
    if (appStatus === "pick") {
      void navigate({ to: PROFILES_ROUTE, replace: true });
      return;
    }

    if (appStatus === "ready") {
      void navigate({ to: DASHBOARD_ROUTE, replace: true });
    }
  }, [navigate, appStatus]);

  if (appStatus === "ready" || appStatus === "pick") {
    return null;
  }

  return <>{children}</>;
}
