import { Hono } from "hono";
import {
  getDatabase,
  accounts,
  eq,
  and,
} from "@workspace/db";
import {
  InsertAccountSchema,
  UpdateAccountSchema,
} from "@workspace/types";
import type { ApiResponse } from "@workspace/types";

type Env = { Variables: { profileId: string } };

const accountRoutes = new Hono<Env>();

function getDb() {
  return getDatabase(process.env.DATABASE_URL!);
}

// GET / — list accounts for profile
accountRoutes.get("/", async (c) => {
  const profileId = c.get("profileId");
  const db = getDb();

  const type = c.req.query("type");
  const isActive = c.req.query("isActive");

  const conditions = [eq(accounts.profileId, profileId)];
  if (type) {
    conditions.push(eq(accounts.type, type as typeof accounts.type.enumValues[number]));
  }
  if (isActive !== undefined) {
    conditions.push(eq(accounts.isActive, isActive === "true"));
  }

  const result = await db
    .select()
    .from(accounts)
    .where(and(...conditions))
    .orderBy(accounts.sortOrder);

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

// GET /:id — single account
accountRoutes.get("/:id", async (c) => {
  const profileId = c.get("profileId");
  const id = c.req.param("id");
  const db = getDb();

  const [result] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.profileId, profileId)));

  if (!result) {
    return c.json<ApiResponse<never>>(
      { success: false, error: { message: "Account not found", code: "NOT_FOUND" } },
      404
    );
  }

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

// POST / — create account
accountRoutes.post("/", async (c) => {
  const profileId = c.get("profileId");
  const body = await c.req.json();
  const parsed = InsertAccountSchema.safeParse(body);

  if (!parsed.success) {
    return c.json<ApiResponse<never>>(
      { success: false, error: { message: parsed.error.issues[0]?.message ?? "Validation failed" } },
      400
    );
  }

  const db = getDb();
  const [result] = await db
    .insert(accounts)
    .values({ ...parsed.data, profileId, balance: String(parsed.data.balance ?? 0) })
    .returning();

  return c.json<ApiResponse<typeof result>>({ success: true, data: result }, 201);
});

// PATCH /:id — update account
accountRoutes.patch("/:id", async (c) => {
  const profileId = c.get("profileId");
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = UpdateAccountSchema.safeParse(body);

  if (!parsed.success) {
    return c.json<ApiResponse<never>>(
      { success: false, error: { message: parsed.error.issues[0]?.message ?? "Validation failed" } },
      400
    );
  }

  const db = getDb();
  const values: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.balance !== undefined) {
    values.balance = String(parsed.data.balance);
  }

  const [result] = await db
    .update(accounts)
    .set(values)
    .where(and(eq(accounts.id, id), eq(accounts.profileId, profileId)))
    .returning();

  if (!result) {
    return c.json<ApiResponse<never>>(
      { success: false, error: { message: "Account not found", code: "NOT_FOUND" } },
      404
    );
  }

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

// DELETE /:id — soft-delete (set isActive: false)
accountRoutes.delete("/:id", async (c) => {
  const profileId = c.get("profileId");
  const id = c.req.param("id");
  const db = getDb();

  const [result] = await db
    .update(accounts)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(accounts.id, id), eq(accounts.profileId, profileId)))
    .returning();

  if (!result) {
    return c.json<ApiResponse<never>>(
      { success: false, error: { message: "Account not found", code: "NOT_FOUND" } },
      404
    );
  }

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

export default accountRoutes;
