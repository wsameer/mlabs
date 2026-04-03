import { Hono } from "hono";
import { getDatabase, profiles, eq, and } from "@workspace/db";
import { InsertProfileSchema, UpdateProfileSchema } from "@workspace/types";
import type { ApiResponse } from "@workspace/types";

type Env = { Variables: { profileId: string } };

const profileRoutes = new Hono<Env>();

function getDb() {
  return getDatabase(process.env.DATABASE_URL!);
}

// GET / — list all profiles
profileRoutes.get("/", async (c) => {
  const db = getDb();

  const result = await db
    .select()
    .from(profiles)
    .where(eq(profiles.isActive, true))
    .orderBy(profiles.createdAt);

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

// GET /:id — single profile
profileRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  const [result] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, id), eq(profiles.isActive, true)));

  if (!result) {
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: { message: "Profile not found", code: "NOT_FOUND" },
      },
      404
    );
  }

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

// GET /default — get default profile
profileRoutes.get("/default", async (c) => {
  const db = getDb();

  const [result] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.isDefault, true), eq(profiles.isActive, true)));

  if (!result) {
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: { message: "Default profile not found", code: "NOT_FOUND" },
      },
      404
    );
  }

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

// POST / — create profile
profileRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = InsertProfileSchema.safeParse(body);

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
    .insert(profiles)
    .values(parsed.data)
    .returning();

  return c.json<ApiResponse<typeof result>>(
    { success: true, data: result },
    201
  );
});

// PATCH /:id — update profile
profileRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = UpdateProfileSchema.safeParse(body);

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
    .update(profiles)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(profiles.id, id), eq(profiles.isActive, true)))
    .returning();

  if (!result) {
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: { message: "Profile not found", code: "NOT_FOUND" },
      },
      404
    );
  }

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

// DELETE /:id — soft-delete profile
profileRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  const [result] = await db
    .update(profiles)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(profiles.id, id), eq(profiles.isActive, true)))
    .returning();

  if (!result) {
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: { message: "Profile not found", code: "NOT_FOUND" },
      },
      404
    );
  }

  return c.json<ApiResponse<typeof result>>({ success: true, data: result });
});

export default profileRoutes;
