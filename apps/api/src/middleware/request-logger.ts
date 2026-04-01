import type { Context, Next } from "hono";
import { logger } from "../libs/logger.js";

export async function requestLogger(c: Context, next: Next) {
  const start = Date.now();
  const { method, path } = c.req;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  logger.info(
    {
      method,
      path,
      status,
      duration,
    },
    "Request completed"
  );
}
