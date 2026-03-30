import { Hono } from "hono";
import {
  getDatabase,
  transactions,
  eq,
  and,
  desc,
  sql,
} from "@workspace/db";
import {
  InsertTransactionSchema,
  UpdateTransactionSchema,
} from "@workspace/types";
import type { ApiResponse } from "@workspace/types";

type Env = { Variables: { profileId: string } };

const transactionRoutes = new Hono<Env>();

function getDb() {
  return getDatabase(process.env.DATABASE_URL!);
}

// GET / — list transactions with filtering and pagination
transactionRoutes.get("/", async (c) => {
  const profileId = c.get("profileId");
  const db = getDb();

  const accountId = c.req.query("accountId");
  const categoryId = c.req.query("categoryId");
  const type = c.req.query("type");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const search = c.req.query("search");
  const limit = Math.min(Number(c.req.query("limit")) || 50, 100);
  const offset = Number(c.req.query("offset")) || 0;

  const conditions = [eq(transactions.profileId, profileId)];

  if (accountId) {
    conditions.push(eq(transactions.accountId, accountId));
  }
  if (categoryId) {
    conditions.push(eq(transactions.categoryId, categoryId));
  }
  if (type) {
    conditions.push(eq(transactions.type, type.toUpperCase() as typeof transactions.type.enumValues[number]));
  }
  if (startDate) {
    conditions.push(sql`${transactions.date} >= ${new Date(startDate)}`);
  }
  if (endDate) {
    conditions.push(sql`${transactions.date} <= ${new Date(endDate)}`);
  }
  if (search) {
    conditions.push(sql`${transactions.description} ILIKE ${`%${search}%`}`);
  }

  const result = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.date))
    .limit(limit)
    .offset(offset);

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

// GET /:id — single transaction
transactionRoutes.get("/:id", async (c) => {
  const profileId = c.get("profileId");
  const id = c.req.param("id");
  const db = getDb();

  const [result] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.profileId, profileId)));

  if (!result) {
    return c.json<ApiResponse<never>>(
      { success: false, error: { message: "Transaction not found", code: "NOT_FOUND" } },
      404
    );
  }

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

// POST / — create transaction
transactionRoutes.post("/", async (c) => {
  const profileId = c.get("profileId");
  const body = await c.req.json();
  const parsed = InsertTransactionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json<ApiResponse<never>>(
      { success: false, error: { message: parsed.error.issues[0]?.message ?? "Validation failed" } },
      400
    );
  }

  const db = getDb();
  const [result] = await db
    .insert(transactions)
    .values({
      ...parsed.data,
      profileId,
      amount: String(parsed.data.amount),
      type: parsed.data.type.toUpperCase() as typeof transactions.type.enumValues[number],
    })
    .returning();

  return c.json<ApiResponse<typeof result>>({ success: true, data: result }, 201);
});

// PATCH /:id — update transaction
transactionRoutes.patch("/:id", async (c) => {
  const profileId = c.get("profileId");
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = UpdateTransactionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json<ApiResponse<never>>(
      { success: false, error: { message: parsed.error.issues[0]?.message ?? "Validation failed" } },
      400
    );
  }

  const db = getDb();
  const values: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.amount !== undefined) {
    values.amount = String(parsed.data.amount);
  }
  if (parsed.data.type) {
    values.type = parsed.data.type.toUpperCase();
  }

  const [result] = await db
    .update(transactions)
    .set(values)
    .where(and(eq(transactions.id, id), eq(transactions.profileId, profileId)))
    .returning();

  if (!result) {
    return c.json<ApiResponse<never>>(
      { success: false, error: { message: "Transaction not found", code: "NOT_FOUND" } },
      404
    );
  }

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

// DELETE /:id — hard delete
transactionRoutes.delete("/:id", async (c) => {
  const profileId = c.get("profileId");
  const id = c.req.param("id");
  const db = getDb();

  const [result] = await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.profileId, profileId)))
    .returning();

  if (!result) {
    return c.json<ApiResponse<never>>(
      { success: false, error: { message: "Transaction not found", code: "NOT_FOUND" } },
      404
    );
  }

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

export default transactionRoutes;
