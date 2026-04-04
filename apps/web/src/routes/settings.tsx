import { SETTINGS_ROUTE } from "@/constants";
import { RequiresProfile } from "@/components/RouteGuards";
import { SettingsPage } from "@/features/settings";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(SETTINGS_ROUTE)({
  component: SettingsRoute,
});

function SettingsRoute() {
  return (
    <RequiresProfile>
      <SettingsPage />
    </RequiresProfile>
  );
}
