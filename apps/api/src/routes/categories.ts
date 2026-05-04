import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type {
  CategoryQuery,
  CreateCategory,
  UpdateCategory,
} from "@workspace/types";

import type { ProfileEnv } from "../middleware/profile.js";
import { categoriesService } from "../services/categories.service.js";
import {
  apiResponseSchema,
  ErrorResponseSchema,
  IdParamSchema,
  CategorySchema,
  CategoryWithSubcategoriesSchema,
} from "../libs/openapi-schemas.js";

const categoriesRoute = new OpenAPIHono<ProfileEnv>();

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const CategoryQueryRouteSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  parentId: z.string().uuid().optional(),
  search: z.string().optional(),
});

const CreateCategoryBodySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().max(50).optional(),
  color: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

const UpdateCategoryBodySchema = CreateCategoryBodySchema.partial();

// ---------------------------------------------------------------------------
// GET / — List categories
// ---------------------------------------------------------------------------

const listCategoriesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Categories"],
  summary: "List categories",
  description:
    "Returns categories with nested subcategories for the current profile.",
  request: { query: CategoryQueryRouteSchema },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: apiResponseSchema(z.array(CategoryWithSubcategoriesSchema)),
        },
      },
      description: "List of categories",
    },
  },
});

categoriesRoute.openapi(listCategoriesRoute, async (c) => {
  const profileId = c.get("profileId");
  const filters = c.req.valid("query") as unknown as CategoryQuery;
  const categoryList = await categoriesService.listCategories(
    profileId,
    filters
  );
  return c.json({ success: true as const, data: categoryList });
});

// ---------------------------------------------------------------------------
// GET /:id — Get category by ID
// ---------------------------------------------------------------------------

const getCategoryRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Categories"],
  summary: "Get category by ID",
  request: { params: IdParamSchema },
  responses: {
    200: {
      content: {
        "application/json": { schema: apiResponseSchema(CategorySchema) },
      },
      description: "Category details",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Category not found",
    },
  },
});

categoriesRoute.openapi(getCategoryRoute, async (c) => {
  const profileId = c.get("profileId");
  const { id } = c.req.valid("param");
  const category = await categoriesService.getCategoryById(profileId, id);
  return c.json({ success: true as const, data: category });
});

// ---------------------------------------------------------------------------
// POST / — Create category
// ---------------------------------------------------------------------------

const createCategoryRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Categories"],
  summary: "Create category",
  request: {
    body: {
      content: { "application/json": { schema: CreateCategoryBodySchema } },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: apiResponseSchema(CategorySchema) },
      },
      description: "Category created",
    },
  },
});

categoriesRoute.openapi(createCategoryRoute, async (c) => {
  const profileId = c.get("profileId");
  const payload = c.req.valid("json") as unknown as CreateCategory;
  const createdCategory = await categoriesService.createCategory(
    profileId,
    payload
  );
  return c.json({ success: true as const, data: createdCategory }, 201);
});

// ---------------------------------------------------------------------------
// PATCH /:id — Update category
// ---------------------------------------------------------------------------

const updateCategoryRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Categories"],
  summary: "Update category",
  request: {
    params: IdParamSchema,
    body: {
      content: { "application/json": { schema: UpdateCategoryBodySchema } },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: apiResponseSchema(CategorySchema) },
      },
      description: "Category updated",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Category not found",
    },
  },
});

categoriesRoute.openapi(updateCategoryRoute, async (c) => {
  const profileId = c.get("profileId");
  const { id } = c.req.valid("param");
  const payload = c.req.valid("json") as unknown as UpdateCategory;
  const updatedCategory = await categoriesService.updateCategory(
    profileId,
    id,
    payload
  );
  return c.json({ success: true as const, data: updatedCategory });
});

// ---------------------------------------------------------------------------
// DELETE /:id — Delete category
// ---------------------------------------------------------------------------

const deleteCategoryRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Categories"],
  summary: "Delete category",
  request: { params: IdParamSchema },
  responses: {
    200: {
      content: {
        "application/json": { schema: apiResponseSchema(CategorySchema) },
      },
      description: "Category deleted",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Category not found",
    },
  },
});

categoriesRoute.openapi(deleteCategoryRoute, async (c) => {
  const profileId = c.get("profileId");
  const { id } = c.req.valid("param");
  const deletedCategory = await categoriesService.deleteCategory(profileId, id);
  return c.json({ success: true as const, data: deletedCategory });
});

export default categoriesRoute;
