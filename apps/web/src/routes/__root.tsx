import { RouteErrorBoundary } from "@/components/ErrorBoundary";
import {
  MAINTENANCE_ROUTE,
  ONBOARDING_ROUTE,
  PROFILES_ROUTE,
  ROOT_ROUTE_PATH,
  SETTINGS_ROUTE,
} from "@/constants";
import { AppBottombar } from "@/features/navigation";
import { useHotkey } from "@/hooks/use-hotkey";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar";
import { NotFoundComponent } from "./404";
import { AppHeader, AppSidebar } from "@/features/layout";
import { SearchDialog } from "@/components/SearchDialog";
import { CreateAccountDialog } from "@/features/accounts";
import { useUiActions } from "@/hooks/use-ui-store";
import { AddTransactionPopover } from "@/features/transactions";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  const navigate = useNavigate();
  const router = useRouterState();
  const { setGlobalSearch } = useUiActions();
  const pathname = router.location.pathname;
  const isPublicRoute =
    pathname === ROOT_ROUTE_PATH ||
    pathname.startsWith(ONBOARDING_ROUTE) ||
    pathname.startsWith(PROFILES_ROUTE) ||
    pathname.startsWith(MAINTENANCE_ROUTE);

  useHotkey({
    key: ",",
    modifiers: ["meta"],
    callback: () => {
      // Store current path to return to after closing settings
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith(SETTINGS_ROUTE)) {
        sessionStorage.setItem("settings-return-path", currentPath);
      }
      navigate({ to: SETTINGS_ROUTE });
    },
  });

  useHotkey({
    key: "k",
    modifiers: ["meta"],
    callback: () => {
      setGlobalSearch(true);
    },
  });

  if (isPublicRoute) {
    return <Outlet />;
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "350px" } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="relative flex flex-1 flex-col gap-4 overflow-x-auto overflow-y-hidden p-4">
          <Outlet />
          {/* Progressive fade for mobile bottom bar */}
          <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/50 to-transparent md:hidden" />
        </div>
        <AppBottombar />
        <SearchDialog />
        <AddTransactionPopover />
        <CreateAccountDialog />
      </SidebarInset>
    </SidebarProvider>
  );
}
