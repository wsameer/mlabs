import type { HealthCheck } from "@workspace/types";

import { env } from "../libs/env.js";
import { getDb, sql } from "../libs/db.js";

export class HealthService {
  async getHealthCheck(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const db = getDb();
      await db.execute(sql`SELECT 1`);

      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "0.0.1",
        database: "connected",
        responseTime: `${Date.now() - startTime}ms`,
        uptime: process.uptime(),
      };
    } catch (error) {
      return {
        status: "error",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "0.0.1",
        database: "disconnected",
        responseTime: `${Date.now() - startTime}ms`,
        uptime: process.uptime(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const healthService = new HealthService();
