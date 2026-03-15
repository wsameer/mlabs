import { DASHBOARD_ROUTE } from "@/constants";
import { useLayoutConfig } from "@/features/layout/hooks/use-layout-config";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(DASHBOARD_ROUTE)({
  component: RouteComponent,
});

function RouteComponent() {
  useLayoutConfig({
    pageTitle: "Dashboard",
  });

  return (
    <>
      {Array.from({ length: 24 }).map((_, index) => (
        <div
          key={index}
          className="aspect-video h-12 w-full rounded-lg bg-muted/50"
        />
      ))}
    </>
  );
}
