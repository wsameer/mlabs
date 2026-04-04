import { createFileRoute } from "@tanstack/react-router";

import { RequiresProfile } from "@/components/RouteGuards";
import { DASHBOARD_ROUTE } from "@/constants";
import { DashboardPage } from "@/features/dashboard";

export const Route = createFileRoute(DASHBOARD_ROUTE)({
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <RequiresProfile>
      <DashboardPage />
    </RequiresProfile>
  );
}
