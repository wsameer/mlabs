import type { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import { categories, type Category } from "./schema.js";

type CategoryDef = {
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
  sortOrder: number;
  children?: ChildDef[];
};

type ChildDef = {
  name: string;
  icon: string;
  sortOrder: number;
};

export const DEFAULT_CATEGORY_TREE: CategoryDef[] = [
  // ── Income (flat) ──
  {
    name: "Salary",
    type: "INCOME",
    icon: "💼",
    color: "#10b981",
    sortOrder: 1,
  },
  { name: "Bonus", type: "INCOME", icon: "🎯", color: "#22c55e", sortOrder: 2 },
  {
    name: "Cashback",
    type: "INCOME",
    icon: "💳",
    color: "#14b8a6",
    sortOrder: 3,
  },
  {
    name: "Refund",
    type: "INCOME",
    icon: "↩️",
    color: "#0ea5e9",
    sortOrder: 4,
  },
  {
    name: "Bank Interest",
    type: "INCOME",
    icon: "🏦",
    color: "#3b82f6",
    sortOrder: 5,
  },
  {
    name: "Dividends",
    type: "INCOME",
    icon: "📈",
    color: "#8b5cf6",
    sortOrder: 6,
  },
  {
    name: "CRA Benefits",
    type: "INCOME",
    icon: "🍁",
    color: "#ef4444",
    sortOrder: 7,
  },
  {
    name: "Rental Income",
    type: "INCOME",
    icon: "🏘️",
    color: "#f59e0b",
    sortOrder: 8,
  },
  {
    name: "Freelance",
    type: "INCOME",
    icon: "💻",
    color: "#6366f1",
    sortOrder: 9,
  },
  { name: "Gift", type: "INCOME", icon: "🎁", color: "#ec4899", sortOrder: 10 },
  {
    name: "Other Income",
    type: "INCOME",
    icon: "💰",
    color: "#64748b",
    sortOrder: 11,
  },

  // ── Expense (with sub-categories) ──
  {
    name: "Housing",
    type: "EXPENSE",
    icon: "🏠",
    color: "#ef4444",
    sortOrder: 1,
    children: [
      { name: "Mortgage", icon: "🏦", sortOrder: 1 },
      { name: "Rent", icon: "🔑", sortOrder: 2 },
      { name: "Condo Fees", icon: "🏢", sortOrder: 3 },
      { name: "Property Taxes", icon: "🧾", sortOrder: 4 },
      { name: "Home Insurance", icon: "🛡️", sortOrder: 5 },
      { name: "Maintenance", icon: "🔧", sortOrder: 6 },
      { name: "Deposit", icon: "💵", sortOrder: 7 },
    ],
  },
  {
    name: "Transportation",
    type: "EXPENSE",
    icon: "🚗",
    color: "#f97316",
    sortOrder: 2,
    children: [
      { name: "Car Payment", icon: "🚙", sortOrder: 1 },
      { name: "Auto Insurance", icon: "🛡️", sortOrder: 2 },
      { name: "Fuel", icon: "⛽", sortOrder: 3 },
      { name: "Parking", icon: "🅿️", sortOrder: 4 },
      { name: "Bus", icon: "🚌", sortOrder: 5 },
      { name: "Subway", icon: "🚇", sortOrder: 6 },
      { name: "Cab", icon: "🚕", sortOrder: 7 },
      { name: "Air Fare", icon: "✈️", sortOrder: 8 },
    ],
  },
  {
    name: "Utilities",
    type: "EXPENSE",
    icon: "⚡",
    color: "#06b6d4",
    sortOrder: 3,
    children: [
      { name: "Heat & Hydro", icon: "💡", sortOrder: 1 },
      { name: "Wifi", icon: "📶", sortOrder: 2 },
      { name: "Phone Bill", icon: "📱", sortOrder: 3 },
      { name: "Laundromat", icon: "🧺", sortOrder: 4 },
    ],
  },
  {
    name: "Food & Dining",
    type: "EXPENSE",
    icon: "🍽️",
    color: "#84cc16",
    sortOrder: 4,
    children: [
      { name: "Restaurants", icon: "🍝", sortOrder: 1 },
      { name: "Coffee", icon: "☕", sortOrder: 2 },
      { name: "Takeout", icon: "🥡", sortOrder: 3 },
      { name: "Alcohol", icon: "🍷", sortOrder: 4 },
    ],
  },
  {
    name: "Healthcare",
    type: "EXPENSE",
    icon: "🏥",
    color: "#ef4444",
    sortOrder: 5,
    children: [
      { name: "Pharmacy", icon: "💊", sortOrder: 1 },
      { name: "Dental", icon: "🦷", sortOrder: 2 },
      { name: "Doctor", icon: "🩺", sortOrder: 3 },
      { name: "Gym & Fitness", icon: "🏋️", sortOrder: 4 },
    ],
  },
  {
    name: "Entertainment",
    type: "EXPENSE",
    icon: "🎬",
    color: "#ec4899",
    sortOrder: 6,
    children: [
      { name: "Movies", icon: "🎞️", sortOrder: 1 },
      { name: "Streaming", icon: "📺", sortOrder: 2 },
      { name: "Events", icon: "🎟️", sortOrder: 3 },
      { name: "Games", icon: "🎮", sortOrder: 4 },
    ],
  },
  {
    name: "Shopping",
    type: "EXPENSE",
    icon: "🛍️",
    color: "#a855f7",
    sortOrder: 7,
    children: [
      { name: "Clothing & Footwear", icon: "👕", sortOrder: 1 },
      { name: "Electronics", icon: "🖥️", sortOrder: 2 },
      { name: "Home Goods", icon: "🛋️", sortOrder: 3 },
    ],
  },
  {
    name: "Groceries",
    type: "EXPENSE",
    icon: "🛒",
    color: "#22c55e",
    sortOrder: 8,
  },
  {
    name: "Subscriptions",
    type: "EXPENSE",
    icon: "🔁",
    color: "#3b82f6",
    sortOrder: 9,
  },
  {
    name: "Personal Care",
    type: "EXPENSE",
    icon: "💆",
    color: "#8b5cf6",
    sortOrder: 10,
  },
  {
    name: "Gifts & Donations",
    type: "EXPENSE",
    icon: "🎀",
    color: "#f43f5e",
    sortOrder: 11,
  },
  {
    name: "Education",
    type: "EXPENSE",
    icon: "🎓",
    color: "#0ea5e9",
    sortOrder: 12,
  },
  {
    name: "Other Expense",
    type: "EXPENSE",
    icon: "📦",
    color: "#64748b",
    sortOrder: 13,
  },
];

/**
 * Back-compat flat list. Contains both parents and children as top-level rows
 * without parent links. Prefer `seedCategoriesForProfile` for new code.
 */
export const DEFAULT_CATEGORIES = DEFAULT_CATEGORY_TREE.flatMap((cat) => {
  const { children, ...parent } = cat;
  const rows: Array<Omit<CategoryDef, "children">> = [parent];
  if (children) {
    for (const child of children) {
      rows.push({
        name: child.name,
        type: cat.type,
        icon: child.icon,
        color: cat.color,
        sortOrder: child.sortOrder,
      });
    }
  }
  return rows;
});

type DrizzleLike = {
  insert: (table: typeof categories) => {
    values: (vals: (typeof categories.$inferInsert)[]) => {
      returning: () => Promise<Category[]>;
    };
  };
};

/**
 * Insert the default category tree for a profile. Parents are inserted first,
 * then children with their resolved `parentId`. Returns all inserted rows.
 */
export async function seedCategoriesForProfile(
  db: DrizzleLike | SQLiteTransaction<"async", unknown, never, never>,
  profileId: string
): Promise<Category[]> {
  const d = db as DrizzleLike;

  const parentRows = DEFAULT_CATEGORY_TREE.map((cat) => ({
    profileId,
    name: cat.name,
    type: cat.type,
    icon: cat.icon,
    color: cat.color,
    sortOrder: cat.sortOrder,
  }));

  const insertedParents = await d
    .insert(categories)
    .values(parentRows)
    .returning();

  const parentIdByName = new Map(insertedParents.map((c) => [c.name, c.id]));

  const childRows: (typeof categories.$inferInsert)[] = [];
  for (const cat of DEFAULT_CATEGORY_TREE) {
    if (!cat.children) continue;
    const parentId = parentIdByName.get(cat.name);
    if (!parentId) continue;
    for (const child of cat.children) {
      childRows.push({
        profileId,
        name: child.name,
        type: cat.type,
        icon: child.icon,
        color: cat.color,
        sortOrder: child.sortOrder,
        parentId,
      });
    }
  }

  if (childRows.length === 0) return insertedParents;

  const insertedChildren = await d
    .insert(categories)
    .values(childRows)
    .returning();
  return [...insertedParents, ...insertedChildren];
}
