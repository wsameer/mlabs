import { Hono } from "hono";
import { getDatabase, categories, eq, and, isNull } from "@workspace/db";
import { InsertCategorySchema, UpdateCategorySchema } from "@workspace/types";
import type { ApiResponse } from "@workspace/types";

type Env = { Variables: { profileId: string } };

const categoryRoutes = new Hono<Env>();

function getDb() {
  return getDatabase(process.env.DATABASE_URL!);
}

// GET / — list categories for profile
categoryRoutes.get("/", async (c) => {
  const profileId = c.get("profileId");
  const db = getDb();

  const type = c.req.query("type");
  const isActive = c.req.query("isActive");
  const parentId = c.req.query("parentId");

  const conditions = [eq(categories.profileId, profileId)];
  if (type) {
    conditions.push(
      eq(categories.type, type as (typeof categories.type.enumValues)[number])
    );
  }
  if (isActive !== undefined) {
    conditions.push(eq(categories.isActive, isActive === "true"));
  }
  if (parentId === "null") {
    conditions.push(isNull(categories.parentId));
  } else if (parentId) {
    conditions.push(eq(categories.parentId, parentId));
  }

  const result = await db
    .select()
    .from(categories)
    .where(and(...conditions))
    .orderBy(categories.sortOrder);

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

// GET /:id — single category
categoryRoutes.get("/:id", async (c) => {
  const profileId = c.get("profileId");
  const id = c.req.param("id");
  const db = getDb();

  const [result] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.profileId, profileId)));

  if (!result) {
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: { message: "Category not found", code: "NOT_FOUND" },
      },
      404
    );
  }

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

// POST / — create category
categoryRoutes.post("/", async (c) => {
  const profileId = c.get("profileId");
  const body = await c.req.json();
  const parsed = InsertCategorySchema.safeParse(body);

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
    .insert(categories)
    .values({ ...parsed.data, profileId })
    .returning();

  return c.json<ApiResponse<typeof result>>(
    { success: true, data: result },
    201
  );
});

// PATCH /:id — update category
categoryRoutes.patch("/:id", async (c) => {
  const profileId = c.get("profileId");
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = UpdateCategorySchema.safeParse(body);

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
    .update(categories)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(categories.id, id), eq(categories.profileId, profileId)))
    .returning();

  if (!result) {
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: { message: "Category not found", code: "NOT_FOUND" },
      },
      404
    );
  }

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

// DELETE /:id — soft-delete
categoryRoutes.delete("/:id", async (c) => {
  const profileId = c.get("profileId");
  const id = c.req.param("id");
  const db = getDb();

  const [result] = await db
    .update(categories)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(categories.id, id), eq(categories.profileId, profileId)))
    .returning();

  if (!result) {
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: { message: "Category not found", code: "NOT_FOUND" },
      },
      404
    );
  }

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

export default categoryRoutes;
