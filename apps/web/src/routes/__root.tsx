import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { RouteErrorBoundary } from "@/components/ErrorBoundary";
import { DASHBOARD_ROUTE } from "@/constants";
import { AppBottombar } from "@/features/navigation";
import { useHotkey } from "@/hooks/use-hotkey";
import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar";
import { NotFoundComponent } from "./404";

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  const navigate = useNavigate();

  // Open settings with Cmd+, (Mac) or Ctrl+, (Windows/Linux)
  useHotkey({
    key: ",",
    modifiers: ["meta"],
    callback: () => {
      // Store current path to return to after closing settings
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/settings")) {
        sessionStorage.setItem("settings-return-path", currentPath);
      }
      navigate({ to: DASHBOARD_ROUTE });
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
        <div className="flex flex-1 flex-col gap-4 p-4"></div>
      </SidebarInset>
      <AppBottombar />
    </SidebarProvider>
  );
}
