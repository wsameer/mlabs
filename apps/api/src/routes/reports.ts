import { Hono } from "hono";
import {
  CategoryTotalsQuerySchema,
} from "@workspace/types";
import type {
  ApiResponse,
  CategoryTotalsResponse,
} from "@workspace/types";

import { validate } from "../middleware/validator.js";
import type { ProfileEnv } from "../middleware/profile.js";
import { reportsService } from "../services/reports.service.js";

const reportsRoute = new Hono<ProfileEnv>();

// ---------------------------------------------------------------------------
// GET /category-totals  — Category-wise totals for pie chart & table
// ---------------------------------------------------------------------------
reportsRoute.get(
  "/category-totals",
  validate("query", CategoryTotalsQuerySchema),
  async (c) => {
    const profileId = c.get("profileId");
    const filters = c.req.valid("query");
    const result = await reportsService.getCategoryTotals(profileId, filters);

    const response: ApiResponse<CategoryTotalsResponse> = {
      success: true,
      data: result,
    };

    return c.json(response);
  }
);

export default reportsRoute;
