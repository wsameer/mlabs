import { HTTPException } from "hono/http-exception";

type AppStatusCode = 400 | 401 | 403 | 404 | 409 | 500;

export class AppError extends Error {
  constructor(
    public statusCode: AppStatusCode,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code?: string) {
    super(400, message, code);
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", code?: string) {
    super(401, message, code);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", code?: string) {
    super(403, message, code);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found", code?: string) {
    super(404, message, code);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code?: string) {
    super(409, message, code);
    this.name = "ConflictError";
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal server error", code?: string) {
    super(500, message, code);
    this.name = "InternalServerError";
  }
}

export function toHTTPException(error: AppError): HTTPException {
  return new HTTPException(error.statusCode as 400 | 401 | 403 | 404 | 409 | 500, {
    message: error.message,
    cause: error,
  });
}
