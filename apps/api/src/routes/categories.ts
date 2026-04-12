import { Hono } from "hono";
import { z } from "zod/v4";
import {
  CategoryQuerySchema,
  CreateCategorySchema,
  UpdateCategorySchema,
} from "@workspace/types";
import type {
  ApiResponse,
  Category,
  CategoryQuery,
  CategoryWithSubcategories,
  CreateCategory,
  UpdateCategory,
} from "@workspace/types";

import { validate } from "../middleware/validator.js";
import type { ProfileEnv } from "../middleware/profile.js";
import { categoriesService } from "../services/categories.service.js";

const categoriesRoute = new Hono<ProfileEnv>();
const CategoryParamsSchema = z.object({
  id: z.uuid(),
});

const CategoryQueryRouteSchema = CategoryQuerySchema.extend({
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

categoriesRoute.get(
  "/",
  validate("query", CategoryQueryRouteSchema),
  async (c) => {
    const profileId = c.get("profileId");
    const filters = c.req.valid("query") as CategoryQuery;
    const categoryList = await categoriesService.listCategories(
      profileId,
      filters
    );

    const response: ApiResponse<CategoryWithSubcategories[]> = {
      success: true,
      data: categoryList,
    };

    return c.json(response);
  }
);

categoriesRoute.get(
  "/:id",
  validate("param", CategoryParamsSchema),
  async (c) => {
    const profileId = c.get("profileId");
    const { id } = c.req.valid("param");
    const category = await categoriesService.getCategoryById(profileId, id);

    const response: ApiResponse<Category> = {
      success: true,
      data: category,
    };

    return c.json(response);
  }
);

categoriesRoute.post("/", validate("json", CreateCategorySchema), async (c) => {
  const payload = c.req.valid("json") as CreateCategory;
  const profileId = c.get("profileId");
  const createdCategory = await categoriesService.createCategory(
    profileId,
    payload
  );

  const response: ApiResponse<Category> = {
    success: true,
    data: createdCategory,
  };

  return c.json(response, 201);
});

categoriesRoute.patch(
  "/:id",
  validate("param", CategoryParamsSchema),
  validate("json", UpdateCategorySchema),
  async (c) => {
    const profileId = c.get("profileId");
    const { id } = c.req.valid("param");
    const payload = c.req.valid("json") as UpdateCategory;
    const updatedCategory = await categoriesService.updateCategory(
      profileId,
      id,
      payload
    );

    const response: ApiResponse<Category> = {
      success: true,
      data: updatedCategory,
    };

    return c.json(response);
  }
);

categoriesRoute.delete(
  "/:id",
  validate("param", CategoryParamsSchema),
  async (c) => {
    const profileId = c.get("profileId");
    const { id } = c.req.valid("param");
    const deletedCategory = await categoriesService.deleteCategory(
      profileId,
      id
    );

    const response: ApiResponse<Category> = {
      success: true,
      data: deletedCategory,
    };

    return c.json(response);
  }
);

export default categoriesRoute;
