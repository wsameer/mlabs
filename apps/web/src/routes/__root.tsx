import { RouteErrorBoundary } from "@/components/ErrorBoundary";
import { SETTINGS_ROUTE } from "@/constants";
import { AppBottombar } from "@/features/navigation";
import { useHotkey } from "@/hooks/use-hotkey";
import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar";
import { NotFoundComponent } from "./404";
import { AppHeader, AppSidebar } from "@/features/layout";
import { SearchDialog } from "@/features/SearchDialog";
import { CreateAccountDialog } from "@/features/create-account";
import { useUiActions } from "@/hooks/use-ui-store";

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  const navigate = useNavigate();
  const { setGlobalSearch } = useUiActions();

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

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
      <AppBottombar />
      <SearchDialog />
      <CreateAccountDialog />
    </SidebarProvider>
  );
}
