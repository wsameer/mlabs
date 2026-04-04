import React, { useEffect } from "react";

import { AppLoader } from "@/components/AppLoader";
import { useAppStore } from "@/stores";

export function BootstrapGate({ children }: React.PropsWithChildren) {
  const fetchAppData = useAppStore((state) => state.fetchAppData);
  const isAppLoading = useAppStore((state) => state.isAppLoading);
  const appStatus = useAppStore((state) => state.appStatus);
  const appError = useAppStore((state) => state.appError);

  useEffect(() => {
    void fetchAppData();
  }, [fetchAppData]);

  if (appError) {
    throw new Error(appError);
  }

  if (isAppLoading || !appStatus) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  return <>{children}</>;
}
