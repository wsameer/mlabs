import { Hono } from "hono";
import { serve } from "@hono/node-server";

import health from "./routes/health.js";

const app = new Hono();

// API Routes (must come before static file serving)

app.get("/", (c) => {
  return c.text("Hello Hono!");
});
app.route("/api/health", health);

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
