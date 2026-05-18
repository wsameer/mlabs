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
import { AppHeader, AppSidebar } from "@/features/layout";
import { SearchDialog } from "@/components/SearchDialog";
import { useUiActions } from "@/hooks/use-ui-store";
import { CreateTransactionDialog } from "@/features/transactions";
import { CreateAccountDialog } from "@/features/add-accounts/CreateAccountDialog";

import { NotFoundComponent } from "./404";

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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col gap-4 overflow-x-auto overflow-y-hidden p-3 pt-0.5">
          <Outlet />
        </div>
        <AppBottombar />
        <SearchDialog />
        <CreateTransactionDialog />
        <CreateAccountDialog />
      </SidebarInset>
    </SidebarProvider>
  );
}
