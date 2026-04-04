import React from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { Toaster } from "@workspace/ui/components/sonner";

import { ThemeProvider } from "@/components/ThemeProvider";
import { GlobalErrorBoundary } from "@/components/ErrorBoundary";
import { router } from "@/lib/router";
import { queryClient } from "@/lib/query-client";
import { AppGate } from "@/components/AppGate";
import { AppLoader } from "@/components/AppLoader";

export function App() {
  return (
    <GlobalErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        storageKey="mlabs-ui-theme"
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AppGate>
              <React.Suspense fallback={<AppLoader />}>
                <RouterProvider router={router} />
                <Toaster />
              </React.Suspense>
            </AppGate>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
}
