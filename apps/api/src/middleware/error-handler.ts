import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { logger } from "../libs/logger.js";
import { AppError } from "../libs/errors.js";

export function errorHandler(err: Error, c: Context) {
  logger.error({ err, path: c.req.path }, "Request error");

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: {
          message: "Validation error",
          code: "VALIDATION_ERROR",
          details: err.issues,
        },
      },
      400
    );
  }

  // Handle AppError
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: {
          message: err.message,
          code: err.code,
        },
      },
      err.statusCode
    );
  }

  // Handle HTTPException
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: {
          message: err.message,
        },
      },
      err.status
    );
  }

  // Handle unknown errors
  return c.json(
    {
      success: false,
      error: {
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      },
    },
    500
  );
}
