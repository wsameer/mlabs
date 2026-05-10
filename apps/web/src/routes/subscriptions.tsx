import { createFileRoute } from "@tanstack/react-router";

import { RequiresProfile } from "@/components/RouteGuards";
import { SUBSCRIPTIONS_ROUTE } from "@/constants";
import { SubscriptionsPage } from "@/features/subscriptions";

export const Route = createFileRoute(SUBSCRIPTIONS_ROUTE)({
  component: SubscriptionsRoute,
});

function SubscriptionsRoute() {
  return (
    <RequiresProfile>
      <SubscriptionsPage />
    </RequiresProfile>
  );
}
