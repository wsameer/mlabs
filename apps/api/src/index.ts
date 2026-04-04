import { join } from "path";
import { existsSync } from "fs";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { rateLimiter } from "hono-rate-limiter";

import { requestLogger } from "./middleware/request-logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { profileMiddleware } from "./middleware/profile.js";
import { env } from "./libs/env.js";

import health from "./routes/health.js";
import bootstrap from "./routes/bootstrap.js";
import profiles from "./routes/profiles.js";
import { logger } from "./libs/logger.js";

const app = new Hono();

// Global Middleware
// Request ID for tracing
app.use("*", requestId());

// Security headers
app.use("*", secureHeaders());

// Request logging
app.use("*", requestLogger);

// CORS - apply to all routes for proper preflight handling
app.use(
  "*",
  cors({
    origin: env.CORS_ORIGIN.split(","),
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-Profile-Id", "X-Request-Id"],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);

// Rate limiting for API routes
app.use(
  "/api/*",
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: "draft-6",
    keyGenerator: (c) => {
      return (
        c.req.header("X-Forwarded-For") ??
        c.req.header("X-Real-Ip") ??
        "unknown"
      );
    },
    handler: (c) => {
      return c.json(
        {
          success: false,
          error: {
            message: "Too many requests, please try again later.",
            code: "RATE_LIMIT_EXCEEDED",
          },
        },
        429
      );
    },
  })
);

// Public Routes
// API root endpoint - useful for discovery and documentation
app.get("/api", (c) => {
  return c.json({
    name: "mLabs API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// Health check with database connectivity
app.route("/api/health", health);
app.route("/api/bootstrap", bootstrap);
app.route("/api/profiles", profiles);

// Profile middleware - validates X-Profile-Id header for all API routes
app.use("/api/*", profileMiddleware);

// Protected API Routes
// app.route("/api/categories", categories);
// app.route("/api/accounts", accounts);
// app.route("/api/transactions", transactionRoutes);

// Static File Serving (Production Only)
if (env.NODE_ENV === "production") {
  const webDistPath = join(process.cwd(), "..", "web", "dist");

  if (existsSync(webDistPath)) {
    logger.info(`Serving static files from: ${webDistPath}`);

    // Serve static assets
    app.use("/*", serveStatic({ root: webDistPath }));

    // SPA fallback - serve index.html for all non-API routes
    app.get("*", serveStatic({ path: join(webDistPath, "index.html") }));
  } else {
    logger.warn(`Web dist directory not found at: ${webDistPath}`);
  }
}

// Error Handling

// 404 handler - must come after all routes
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        message: "Not found",
        code: "NOT_FOUND",
      },
    },
    404
  );
});

// Global error handler
app.onError(errorHandler);

// Server Startup
const port = env.PORT;

const server = serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    logger.info(`Server is running on http://localhost:${info.port}/api`);
    logger.info(`Environment: ${env.NODE_ENV}`);
    logger.info(`Rate limiting: 100 requests per 15 minutes`);
  }
);

// Graceful Shutdown
function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully...`);

  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
