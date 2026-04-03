import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { useAppStore } from "@/stores/app-store";
import { useHealthCheck } from "@/hooks/use-health-check";
import { MAINTENANCE_ROUTE } from "@/constants";

export function BackendStatus() {
  const { data, isError, isSuccess } = useHealthCheck();
  const navigate = useNavigate();
  const setBackendStatus = useAppStore((s) => s.setBackendStatus);
  const setBackendHealth = useAppStore((s) => s.setBackendHealth);

  useEffect(() => {
    if (isSuccess && data?.status === "ok") {
      setBackendStatus("connected");
      setBackendHealth(data);
    } else if (isError) {
      setBackendStatus("disconnected");
      navigate({ to: MAINTENANCE_ROUTE, replace: true });
    }
  }, [isSuccess, isError, data, setBackendStatus, setBackendHealth, navigate]);

  return null;
}
