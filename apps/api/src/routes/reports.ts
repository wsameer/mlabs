import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { ProfileEnv } from "../middleware/profile.js";
import { reportsService } from "../services/reports.service.js";

const reportsRoute = new OpenAPIHono<ProfileEnv>();

// ---------------------------------------------------------------------------
// Schemas (classic zod for OpenAPI compatibility)
// ---------------------------------------------------------------------------

const CategoryTotalsQuerySchema = z.object({
  startDate: z.string().optional().openapi({ example: "2026-01-01" }),
  endDate: z.string().optional().openapi({ example: "2026-03-31" }),
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

const CashflowMonthlyItemSchema = z.object({
  month: z.string().openapi({ example: "2026-05" }),
  income: z.string().openapi({ example: "4200.00" }),
  expense: z.string().openapi({ example: "2150.00" }),
});

const CashflowMonthlyResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    items: z.array(CashflowMonthlyItemSchema),
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
    "Returns aggregated totals grouped by category for an optional date range and transaction type. Useful for pie charts and summary tables.",
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

// ---------------------------------------------------------------------------
// GET /cashflow-monthly  — Trailing 12 months of income vs expense
// ---------------------------------------------------------------------------

const cashflowMonthlyRoute = createRoute({
  method: "get",
  path: "/cashflow-monthly",
  tags: ["Reports"],
  summary: "Get trailing 12 months of income vs expense",
  description:
    "Returns 12 monthly buckets (oldest to newest, including the current month) of summed income and expense. Empty months are zero-filled.",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CashflowMonthlyResponseSchema,
        },
      },
      description: "Trailing 12 months of monthly income and expense totals",
    },
  },
});

reportsRoute.openapi(cashflowMonthlyRoute, async (c) => {
  const profileId = c.get("profileId");
  const result = await reportsService.getCashflowMonthly(profileId);

  return c.json({
    success: true as const,
    data: result,
  });
});

export default reportsRoute;
