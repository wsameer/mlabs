import { Hono } from "hono";
import type { ApiResponse, Bootstrap } from "@workspace/types";

import { bootstrapService } from "../services/bootstrap.service.js";

const bootstrap = new Hono();

bootstrap.get("/", async (c) => {
  const data = await bootstrapService.getAppBootstrap();

  const response: ApiResponse<Bootstrap> = {
    success: true,
    data,
  };

  return c.json(response);
});

export default bootstrap;
