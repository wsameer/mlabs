import { createFileRoute } from "@tanstack/react-router";
import { ROOT_ROUTE_PATH } from "@/constants";
import { BootstrapRedirect } from "@/components/BootstrapRedirect";

export const Route = createFileRoute(ROOT_ROUTE_PATH)({
  component: BootstrapRedirect,
});
