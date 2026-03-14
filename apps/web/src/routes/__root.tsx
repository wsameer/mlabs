import { AppSidebar } from "@/components/AppSidebar";
import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Separator } from "@workspace/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import { Suspense } from "react";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const navigate = useNavigate();

  // Open settings with Cmd+, (Mac) or Ctrl+, (Windows/Linux)
  // TODO
  // useHotkey({
  //   key: ",",
  //   modifiers: ["meta"],
  //   callback: () => {
  //     // Store current path to return to after closing settings
  //     const currentPath = window.location.pathname;
  //     if (!currentPath.startsWith("/settings")) {
  //       sessionStorage.setItem("settings-return-path", currentPath);
  //     }
  //     navigate({ to: PROFILE_SETTINGS_ROUTE });
  //   },
  // });

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
        <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {Array.from({ length: 24 }).map((_, index) => (
            <div
              key={index}
              className="aspect-video h-12 w-full rounded-lg bg-muted/50"
            />
          ))}
        </div>
      </SidebarInset>
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <TanStackRouterDevtools
            initialIsOpen={false}
            position="bottom-right"
          />
        </Suspense>
      )}
    </SidebarProvider>
  );
}
