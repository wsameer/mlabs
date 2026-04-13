import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

import { healthService } from "../services/health.service.js";

const health = new OpenAPIHono();

const HealthCheckSchema = z.object({
  status: z.enum(["ok", "error"]),
  timestamp: z.string(),
  version: z.string().optional(),
  database: z.enum(["connected", "disconnected"]).optional(),
  responseTime: z.string().optional(),
  uptime: z.number().optional(),
  error: z.string().optional(),
});

const route = createRoute({
  method: "get",
  path: "/",
  tags: ["Health"],
  summary: "Health check",
  description: "Returns the health status of the API and database connectivity.",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: HealthCheckSchema,
          }),
        },
      },
      description: "Service is healthy",
    },
    503: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            error: z.object({
              message: z.string(),
            }).optional(),
            data: HealthCheckSchema,
          }),
        },
      },
      description: "Service is unhealthy",
    },
  },
});

health.openapi(route, async (c) => {
  const healthData = await healthService.getHealthCheck();

  if (healthData.status === "ok") {
    return c.json({ success: true as const, data: healthData }, 200);
  }

  return c.json(
    {
      success: false as const,
      error: { message: healthData.error ?? "Unknown error" },
      data: healthData,
    },
    503
  );
});

export default health;
