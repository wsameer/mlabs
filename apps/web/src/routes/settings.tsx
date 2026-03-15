import { SETTINGS_ROUTE } from "@/constants";
import { useLayoutConfig } from "@/features/layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(SETTINGS_ROUTE)({
  component: RouteComponent,
});

function RouteComponent() {
  useLayoutConfig({
    pageTitle: "Settings",
  });

  return <div>Hello "/settings/"!</div>;
}
