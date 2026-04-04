import { useHealthCheck } from "@/hooks/use-health-check";
import { MaintenancePage } from "@/routes/maintenance";
import { useAppStore } from "@/stores";
import { Spinner } from "@workspace/ui/components/spinner";
import React, { useEffect } from "react";

export const AppGate = ({ children }: React.PropsWithChildren) => {
  const { data, isError, isPending } = useHealthCheck();
  const setBackendStatus = useAppStore((s) => s.setBackendStatus);
  const setBackendHealth = useAppStore((s) => s.setBackendHealth);

  const isHealthy = !isPending && !isError && data?.status === "ok";

  useEffect(() => {
    if (isHealthy) {
      setBackendStatus("connected");
      setBackendHealth(data);
    } else if (isError) {
      setBackendStatus("disconnected");
    }
  }, [isHealthy, isError, data, setBackendStatus, setBackendHealth]);

  if (isPending)
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <Spinner className="size-16" />
      </div>
    );

  if (!isHealthy)
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <MaintenancePage />
      </div>
    );

  return <>{children}</>;
};
