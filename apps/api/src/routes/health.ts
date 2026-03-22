import { Hono } from "hono";

import type { HealthCheck } from "@workspace/types";

const health = new Hono();

health.get("/", (c) => {
  const response: HealthCheck = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.0.1",
  };

  return c.json(response);
});

export default health;
