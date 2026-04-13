import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { ProfileEnv } from "../middleware/profile.js";
import { reportsService } from "../services/reports.service.js";

const reportsRoute = new OpenAPIHono<ProfileEnv>();

// ---------------------------------------------------------------------------
// Schemas (classic zod for OpenAPI compatibility)
// ---------------------------------------------------------------------------

const CategoryTotalsQuerySchema = z.object({
  startDate: z.string().openapi({ example: "2026-01-01" }),
  endDate: z.string().openapi({ example: "2026-03-31" }),
  type: z.enum(["INCOME", "EXPENSE"]).openapi({ example: "EXPENSE" }),
  accountId: z.string().uuid().optional().openapi({ example: undefined }),
});

const CategoryTotalSchema = z.object({
  categoryId: z.string().nullable(),
  categoryName: z.string(),
  categoryIcon: z.string().nullable(),
  categoryColor: z.string().nullable(),
  total: z.string(),
  percentage: z.number(),
  transactionCount: z.number(),
});

const CategoryTotalsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    items: z.array(CategoryTotalSchema),
    grandTotal: z.string(),
  }),
});

// ---------------------------------------------------------------------------
// GET /category-totals  — Category-wise totals for pie chart & table
// ---------------------------------------------------------------------------

const categoryTotalsRoute = createRoute({
  method: "get",
  path: "/category-totals",
  tags: ["Reports"],
  summary: "Get category-wise totals",
  description:
    "Returns aggregated totals grouped by category for a given date range and transaction type. Useful for pie charts and summary tables.",
  request: {
    query: CategoryTotalsQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CategoryTotalsResponseSchema,
        },
      },
      description: "Category totals with percentages and grand total",
    },
  },
});

reportsRoute.openapi(categoryTotalsRoute, async (c) => {
  const profileId = c.get("profileId");
  const filters = c.req.valid("query");
  const result = await reportsService.getCategoryTotals(profileId, filters);

  return c.json({
    success: true as const,
    data: result,
  });
});

export default reportsRoute;
