import React from "react";

import { RouterProvider } from "@tanstack/react-router";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { Toaster } from "@workspace/ui/components/sonner";

import { ThemeProvider } from "@/features/theme-provider";
import { GlobalErrorBoundary } from "@/components/ErrorBoundary";
import { router } from "@/lib/router";
import { AppLoader } from "@/features/AppLoader";

export function App() {
  return (
    <GlobalErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="mlbas-ui-theme">
        <TooltipProvider>
          <React.Suspense fallback={<AppLoader />}>
            <RouterProvider router={router} />
            <Toaster />
          </React.Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
}
