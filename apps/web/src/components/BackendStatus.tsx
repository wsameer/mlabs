import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { useHealthCheck } from "@/hooks/use-health-check";

export function BackendStatus() {
  const { isError } = useHealthCheck();
  const navigate = useNavigate();

  useEffect(() => {
    if (isError) {
      navigate({ to: "/maintenance", replace: true });
    }
  }, [isError, navigate]);

  return null;
}
