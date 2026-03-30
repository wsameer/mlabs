import { DASHBOARD_ROUTE } from "@/constants";
import { DashboardPage } from "@/features/dashboard";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(DASHBOARD_ROUTE)({
  component: DashboardPage,
});
