import { createFileRoute } from "@tanstack/react-router";

import { RequiresProfile } from "@/components/RouteGuards";
import { NET_WORTH_ROUTE } from "@/constants";
import { NetWorthPage } from "@/features/net-worth-chart";

export const Route = createFileRoute(NET_WORTH_ROUTE)({
  component: NetWorthRoute,
});

function NetWorthRoute() {
  return (
    <RequiresProfile>
      <NetWorthPage />
    </RequiresProfile>
  );
}
