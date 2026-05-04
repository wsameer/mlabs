import { categories } from "@workspace/db";
import type {
  Category,
  CategoryQuery,
  CategoryWithSubcategories,
  CreateCategory,
  UpdateCategory,
} from "@workspace/types";

import { and, asc, db, eq, sql } from "../libs/db.js";
import { InternalServerError, NotFoundError } from "../libs/errors.js";
import { serializeCategory } from "./category-serializer.js";

export class CategoriesService {
  async listCategories(
    profileId: string,
    filters?: CategoryQuery
  ): Promise<CategoryWithSubcategories[]> {
    const conditions = [eq(categories.profileId, profileId)];

    if (filters?.type) {
      conditions.push(eq(categories.type, filters.type));
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(categories.isActive, filters.isActive));
    }

    if (filters?.search?.trim()) {
      const search = `%${filters.search.trim().toLowerCase()}%`;
      conditions.push(sql`lower(${categories.name}) like ${search}`);
    }

    const rows = await db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(asc(categories.sortOrder), asc(categories.createdAt));

    const serialized = rows.map(serializeCategory);

    // Group into parent → children hierarchy
    const parentMap = new Map<string, CategoryWithSubcategories>();
    const orphans: CategoryWithSubcategories[] = [];

    // First pass: collect parents (no parentId)
    for (const cat of serialized) {
      if (!cat.parentId) {
        parentMap.set(cat.id, { ...cat, subcategories: [] });
      }
    }

    // Second pass: attach children
    for (const cat of serialized) {
      if (cat.parentId) {
        const parent = parentMap.get(cat.parentId);
        if (parent) {
          parent.subcategories!.push(cat);
        } else {
          // Parent was filtered out or doesn't exist — include as top-level
          orphans.push(cat);
        }
      }
    }

    return [...parentMap.values(), ...orphans];
  }

  async getCategoryById(profileId: string, id: string): Promise<Category> {
    const rows = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.profileId, profileId)))
      .limit(1);

    const category = rows[0];

    if (!category) {
      throw new NotFoundError("Category not found", "CATEGORY_NOT_FOUND");
    }

    return serializeCategory(category);
  }

  async createCategory(
    profileId: string,
    payload: CreateCategory
  ): Promise<Category> {
    const insertedCategories = await db
      .insert(categories)
      .values({
        profileId,
        name: payload.name,
        type: payload.type,
        icon: payload.icon,
        color: payload.color,
        parentId: payload.parentId,
        isActive: payload.isActive,
        sortOrder: payload.sortOrder,
      })
      .returning();

    const category = insertedCategories[0];

    if (!category) {
      throw new InternalServerError(
        "Failed to create category",
        "CATEGORY_CREATE_FAILED"
      );
    }

    return serializeCategory(category);
  }

  async updateCategory(
    profileId: string,
    id: string,
    payload: UpdateCategory
  ): Promise<Category> {
    await this.getCategoryById(profileId, id);

    const updates = {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.type !== undefined ? { type: payload.type } : {}),
      ...(payload.icon !== undefined ? { icon: payload.icon } : {}),
      ...(payload.color !== undefined ? { color: payload.color } : {}),
      ...(payload.parentId !== undefined ? { parentId: payload.parentId } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      ...(payload.sortOrder !== undefined
        ? { sortOrder: payload.sortOrder }
        : {}),
      updatedAt: new Date(),
    };

    const updatedRows = await db
      .update(categories)
      .set(updates)
      .where(and(eq(categories.id, id), eq(categories.profileId, profileId)))
      .returning();

    const updatedCategory = updatedRows[0];

    if (!updatedCategory) {
      throw new InternalServerError(
        "Failed to update category",
        "CATEGORY_UPDATE_FAILED"
      );
    }

    return serializeCategory(updatedCategory);
  }

  async deleteCategory(profileId: string, id: string): Promise<Category> {
    await this.getCategoryById(profileId, id);

    const deletedRows = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.profileId, profileId)))
      .returning();

    const deletedCategory = deletedRows[0];

    if (!deletedCategory) {
      throw new InternalServerError(
        "Failed to delete category",
        "CATEGORY_DELETE_FAILED"
      );
    }

    return serializeCategory(deletedCategory);
  }
}

export const categoriesService = new CategoriesService();
