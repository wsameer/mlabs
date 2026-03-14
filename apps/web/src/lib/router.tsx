import { createRouter, type RouteIds } from "@tanstack/react-router";
import { routeTree } from "../routeTree.gen";

export const router = createRouter({
  routeTree,
  defaultPendingComponent: () => (
    <div>Loading form global pending component...</div>
  ),
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
export type RouterType = typeof router;
export type RouterIds = RouteIds<RouterType["routeTree"]>;
