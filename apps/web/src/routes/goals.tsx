import { createFileRoute } from "@tanstack/react-router";

import { RequiresProfile } from "@/components/RouteGuards";
import { GOALS_ROUTE } from "@/constants";
import { GoalsPage } from "@/features/goals";

export const Route = createFileRoute(GOALS_ROUTE)({
  component: GoalsRoute,
});

function GoalsRoute() {
  return (
    <RequiresProfile>
      <GoalsPage />
    </RequiresProfile>
  );
}
