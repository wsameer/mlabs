import { Hono } from "hono";
import { getDatabase, sql } from "@workspace/db";

import type { HealthCheck, ApiResponse } from "@workspace/types";

const health = new Hono();

health.get("/", async (c) => {
  const startTime = Date.now();

  try {
    const db = getDatabase(process.env.DATABASE_URL!);
    await db.execute(sql`SELECT 1`);

    const responseTime = Date.now() - startTime;

    const healthData: HealthCheck = {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.0.1",
      database: "connected",
      responseTime: `${responseTime}ms`,
      uptime: process.uptime(),
    };

    const response: ApiResponse<HealthCheck> = {
      success: true,
      data: healthData,
    };

    return c.json(response);
  } catch (error) {
    const responseTime = Date.now() - startTime;

    const healthData: HealthCheck = {
      status: "error",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.0.1",
      database: "disconnected",
      responseTime: `${responseTime}ms`,
      uptime: process.uptime(),
      error: error instanceof Error ? error.message : "Unknown error",
    };

    const response: ApiResponse<HealthCheck> = {
      success: false,
      error: { message: healthData.error! },
      data: healthData,
    };

    return c.json(response, 503);
  }
});

export default health;
