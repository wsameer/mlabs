import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";

import { profileMiddleware } from "./middleware/profile.js";
import health from "./routes/health.js";
import accountRoutes from "./routes/accounts.js";
import categoryRoutes from "./routes/categories.js";
import transactionRoutes from "./routes/transactions.js";

const app = new Hono();

// CORS
app.use(
  "/api/*",
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-Profile-Id"],
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

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
