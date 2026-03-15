import { ACCOUNTS_ROUTE } from "@/constants";
import { useLayoutConfig } from "@/features/layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(ACCOUNTS_ROUTE)({
  component: RouteComponent,
});

function RouteComponent() {
  useLayoutConfig({
    pageTitle: "Accounts",
  });

  return <div>Hello "/accounts"!</div>;
}
