import { Hono } from "hono";
import type { ApiResponse, HealthCheck } from "@workspace/types";

import { healthService } from "../services/health.service.js";

const health = new Hono();

health.get("/", async (c) => {
  const healthData = await healthService.getHealthCheck();

  const response: ApiResponse<HealthCheck> =
    healthData.status === "ok"
      ? {
          success: true,
          data: healthData,
        }
      : {
          success: false,
          error: { message: healthData.error ?? "Unknown error" },
          data: healthData,
        };

  return c.json(response, healthData.status === "ok" ? 200 : 503);
});

export default health;
