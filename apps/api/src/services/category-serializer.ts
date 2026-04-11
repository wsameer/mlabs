import { categories } from "@workspace/db";
import type { Category } from "@workspace/types";

export function serializeCategory(
  category: typeof categories.$inferSelect
): Category {
  return {
    ...category,
    icon: category.icon ?? undefined,
    color: category.color ?? undefined,
    parentId: category.parentId ?? undefined,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}
