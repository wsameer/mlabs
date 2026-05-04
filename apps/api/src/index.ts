import { join } from "path";
import { existsSync } from "fs";
import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { rateLimiter } from "hono-rate-limiter";

import { requestLogger } from "./middleware/request-logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { profileMiddleware } from "./middleware/profile.js";
import { env } from "./libs/env.js";
import { applyMigrationsIfEnabled } from "./libs/migrations.js";

import health from "./routes/health.js";
import bootstrap from "./routes/bootstrap.js";
import profiles from "./routes/profiles.js";
import accounts from "./routes/accounts.js";
import categories from "./routes/categories.js";
import transactions from "./routes/transactions.js";
import reports from "./routes/reports.js";
import { logger } from "./libs/logger.js";

const app = new OpenAPIHono();

function getWebDistPath() {
  const explicitPath = process.env.WEB_DIST_PATH;
  if (explicitPath && existsSync(explicitPath)) {
    return explicitPath;
  }

  const candidates = [
    join(process.cwd(), "apps", "web", "dist"),
    join(process.cwd(), "..", "web", "dist"),
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

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
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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

// OpenAPI Spec & Swagger UI (public — before profile middleware)
app.doc("/api/spec", {
  openapi: "3.1.0",
  info: {
    title: "mLabs API",
    version: "1.0.0",
    description:
      "Personal finance app API — manage profiles, accounts, categories, and transactions.",
  },
});

app.get("/api/docs", swaggerUI({ url: "/api/spec" }));

// Profile middleware - validates X-Profile-Id header for all API routes
app.use("/api/*", profileMiddleware);

// Protected API Routes
app.route("/api/categories", categories);
app.route("/api/accounts", accounts);
app.route("/api/transactions", transactions);
app.route("/api/reports", reports);

// Static File Serving (Production Only)
if (env.NODE_ENV === "production") {
  const webDistPath = getWebDistPath();

  if (webDistPath) {
    logger.info(`Serving static files from: ${webDistPath}`);

    // Serve static assets
    app.use("/*", serveStatic({ root: webDistPath }));

    // SPA fallback - serve index.html for all non-API routes
    app.get("*", serveStatic({ path: join(webDistPath, "index.html") }));
  } else {
    logger.warn("Web dist directory not found; API-only mode enabled");
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

// Apply migrations when desktop sidecar provides MIGRATIONS_FOLDER
await applyMigrationsIfEnabled();

// Server Startup
const port = env.PORT;
const host = env.HOST;

const server = serve(
  {
    fetch: app.fetch,
    port,
    hostname: host,
  },
  (info) => {
    logger.info(`Server is running on http://${host}:${info.port}/api`);
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
