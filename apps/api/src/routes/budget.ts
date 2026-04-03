import { Hono } from "hono";
import { getDatabase, budgets, categories, eq, and, sql } from "@workspace/db";
import { InsertBudgetSchema, UpdateBudgetSchema } from "@workspace/types";
import type { ApiResponse } from "@workspace/types";

type Env = { Variables: { profileId: string } };

const budgetRoutes = new Hono<Env>();

function getDb() {
  return getDatabase(process.env.DATABASE_URL!);
}

// GET / — list budgets with optional filtering
budgetRoutes.get("/", async (c) => {
  const profileId = c.get("profileId");
  const db = getDb();

  const categoryId = c.req.query("categoryId");
  const period = c.req.query("period");
  const isActive = c.req.query("isActive");

  const conditions = [eq(budgets.profileId, profileId)];

  if (categoryId) {
    conditions.push(eq(budgets.categoryId, categoryId));
  }
  if (period) {
    conditions.push(
      eq(budgets.period, period as (typeof budgets.period.enumValues)[number])
    );
  }
  if (isActive !== undefined) {
    conditions.push(eq(budgets.isActive, isActive === "true"));
  }

  const result = await db
    .select({
      id: budgets.id,
      profileId: budgets.profileId,
      categoryId: budgets.categoryId,
      amount: budgets.amount,
      period: budgets.period,
      startDate: budgets.startDate,
      endDate: budgets.endDate,
      isActive: budgets.isActive,
      createdAt: budgets.createdAt,
      updatedAt: budgets.updatedAt,
      category: {
        id: categories.id,
        name: categories.name,
        type: categories.type,
        color: categories.color,
        icon: categories.icon,
      },
    })
    .from(budgets)
    .leftJoin(categories, eq(budgets.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(budgets.startDate);

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

// GET /:id — single budget
budgetRoutes.get("/:id", async (c) => {
  const profileId = c.get("profileId");
  const id = c.req.param("id");
  const db = getDb();

  const [result] = await db
    .select({
      id: budgets.id,
      profileId: budgets.profileId,
      categoryId: budgets.categoryId,
      amount: budgets.amount,
      period: budgets.period,
      startDate: budgets.startDate,
      endDate: budgets.endDate,
      isActive: budgets.isActive,
      createdAt: budgets.createdAt,
      updatedAt: budgets.updatedAt,
      category: {
        id: categories.id,
        name: categories.name,
        type: categories.type,
        color: categories.color,
        icon: categories.icon,
      },
    })
    .from(budgets)
    .leftJoin(categories, eq(budgets.categoryId, categories.id))
    .where(and(eq(budgets.id, id), eq(budgets.profileId, profileId)));

  if (!result) {
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: { message: "Budget not found", code: "NOT_FOUND" },
      },
      404
    );
  }

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

// GET /summary — get budget summary with spending
budgetRoutes.get("/summary", async (c) => {
  const profileId = c.get("profileId");
  const db = getDb();

  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");

  const conditions = [eq(budgets.profileId, profileId), eq(budgets.isActive, true)];

  if (startDate) {
    conditions.push(sql`${budgets.startDate} >= ${new Date(startDate)}`);
  }
  if (endDate) {
    conditions.push(sql`${budgets.startDate} <= ${new Date(endDate)}`);
  }

  const result = await db
    .select({
      id: budgets.id,
      categoryId: budgets.categoryId,
      amount: budgets.amount,
      period: budgets.period,
      startDate: budgets.startDate,
      endDate: budgets.endDate,
      category: {
        id: categories.id,
        name: categories.name,
        type: categories.type,
        color: categories.color,
        icon: categories.icon,
      },
    })
    .from(budgets)
    .leftJoin(categories, eq(budgets.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(budgets.startDate);

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

// POST / — create budget
budgetRoutes.post("/", async (c) => {
  const profileId = c.get("profileId");
  const body = await c.req.json();
  const parsed = InsertBudgetSchema.safeParse(body);

  if (!parsed.success) {
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          message: parsed.error.issues[0]?.message ?? "Validation failed",
        },
      },
      400
    );
  }

  const db = getDb();
  const [result] = await db
    .insert(budgets)
    .values({
      ...parsed.data,
      profileId,
      amount: String(parsed.data.amount),
    })
    .returning();

  return c.json<ApiResponse<typeof result>>(
    { success: true, data: result },
    201
  );
});

// PATCH /:id — update budget
budgetRoutes.patch("/:id", async (c) => {
  const profileId = c.get("profileId");
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = UpdateBudgetSchema.safeParse(body);

  if (!parsed.success) {
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          message: parsed.error.issues[0]?.message ?? "Validation failed",
        },
      },
      400
    );
  }

  const db = getDb();
  const values: Record<string, unknown> = {
    ...parsed.data,
    updatedAt: new Date(),
  };
  if (parsed.data.amount !== undefined) {
    values.amount = String(parsed.data.amount);
  }

  const [result] = await db
    .update(budgets)
    .set(values)
    .where(and(eq(budgets.id, id), eq(budgets.profileId, profileId)))
    .returning();

  if (!result) {
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: { message: "Budget not found", code: "NOT_FOUND" },
      },
      404
    );
  }

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

// DELETE /:id — soft-delete budget
budgetRoutes.delete("/:id", async (c) => {
  const profileId = c.get("profileId");
  const id = c.req.param("id");
  const db = getDb();

  const [result] = await db
    .update(budgets)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(budgets.id, id), eq(budgets.profileId, profileId)))
    .returning();

  if (!result) {
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: { message: "Budget not found", code: "NOT_FOUND" },
      },
      404
    );
  }

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

export default budgetRoutes;
