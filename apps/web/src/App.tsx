import React from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "@tanstack/react-router";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { Toaster } from "@workspace/ui/components/sonner";

import { ThemeProvider } from "@/components/ThemeProvider";
import { GlobalErrorBoundary } from "@/components/ErrorBoundary";
import { router } from "@/lib/router";
import { queryClient } from "@/lib/query-client";
import { AppLoader } from "@/components/AppLoader";

export function App() {
  return (
    <GlobalErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        storageKey="mlbas-ui-theme"
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <React.Suspense fallback={<AppLoader />}>
              <RouterProvider router={router} />
              <Toaster />
            </React.Suspense>
          </TooltipProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
}
