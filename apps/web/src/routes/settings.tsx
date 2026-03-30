import { SETTINGS_ROUTE } from "@/constants";
import { SettingsPage } from "@/features/settings";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(SETTINGS_ROUTE)({
  component: SettingsPage,
});
