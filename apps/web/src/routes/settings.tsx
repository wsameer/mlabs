import { SETTINGS_ROUTE } from "@/constants";
import { RequiresProfile } from "@/components/RouteGuards";
import { SettingsPage } from "@/features/settings";
import { createFileRoute } from "@tanstack/react-router";
import { SettingsSearchSchema } from "@/features/settings/constants";

export const Route = createFileRoute(SETTINGS_ROUTE)({
  component: SettingsRoute,
  validateSearch: SettingsSearchSchema,
});

function SettingsRoute() {
  return (
    <RequiresProfile>
      <SettingsPage />
    </RequiresProfile>
  );
}
