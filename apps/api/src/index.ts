import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";

import { profileMiddleware } from "./middleware/profile.js";
import health from "./routes/health.js";
import accountRoutes from "./routes/accounts.js";
import categoryRoutes from "./routes/categories.js";
import transactionRoutes from "./routes/transactions.js";
import { requestLogger } from "./middleware/request-logger.js";
import { logger } from "./libs/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { env } from "./libs/env.js";

const app = new Hono();

app.use("*", requestLogger);
// CORS
app.use(
  "/api/*",
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-Profile-Id"],
    credentials: true,
  })
);

// Public routes
app.get("/", (c) => {
  return c.text("Hello Hono!");
});
app.route("/api/health", health);

// Protected routes (require X-Profile-Id)
app.use("/api/accounts/*", profileMiddleware);
app.use("/api/accounts", profileMiddleware);
app.use("/api/categories/*", profileMiddleware);
app.use("/api/categories", profileMiddleware);
app.use("/api/transactions/*", profileMiddleware);
app.use("/api/transactions", profileMiddleware);

app.route("/api/accounts", accountRoutes);
app.route("/api/categories", categoryRoutes);
app.route("/api/transactions", transactionRoutes);

// Error handler
app.onError(errorHandler);

// Start server
const port = env.PORT;

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    logger.info(`Server is running on http://localhost:${info.port}/api`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  }
);
