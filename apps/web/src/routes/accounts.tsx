import { ACCOUNTS_ROUTE } from "@/constants";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(ACCOUNTS_ROUTE)({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/accounts"!</div>;
}
