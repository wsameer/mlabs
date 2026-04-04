import { relations } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const DATE_FORMATS = [
  "D MMM, YYYY",
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD",
] as const;

export const WEEK_STARTS = ["SUNDAY", "MONDAY"] as const;
export const PROFILE_TYPES = ["PERSONAL", "BUSINESS", "SHARED"] as const;
export const ACCOUNT_GROUPS = [
  "checking",
  "savings",
  "cash",
  "credit_card",
  "investment",
  "loan",
  "mortgage",
  "asset",
  "other",
] as const;
export const CATEGORY_TYPES = ["INCOME", "EXPENSE"] as const;
export const TRANSACTION_TYPES = ["INCOME", "EXPENSE", "TRANSFER"] as const;

export const profiles = sqliteTable(
  "profiles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    icon: text("icon"),
    type: text("type", { enum: PROFILE_TYPES }).notNull().default("PERSONAL"),
    currency: text("currency").notNull().default("CAD"),
    dateFormat: text("date_format", { enum: DATE_FORMATS })
      .notNull()
      .default("D MMM, YYYY"),
    weekStart: text("week_start", { enum: WEEK_STARTS })
      .notNull()
      .default("MONDAY"),
    timezone: text("timezone").notNull().default("America/Toronto"),
    isDefault: integer("is_default", { mode: "boolean" })
      .notNull()
      .default(false),
    isActive: integer("is_active", { mode: "boolean" })
      .notNull()
      .default(true),
    isSetupComplete: integer("is_setup_complete", { mode: "boolean" })
      .notNull()
      .default(false),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("profiles_default_idx").on(table.isDefault),
    index("profiles_active_idx").on(table.isActive),
  ]
);

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    group: text("group", { enum: ACCOUNT_GROUPS }).notNull(),
    balance: text("balance").notNull().default("0"),
    currency: text("currency").notNull().default("CAD"),
    originalAmount: text("original_amount"),
    interestRate: text("interest_rate"),
    nextPaymentDate: text("next_payment_date"),
    linkedAccountId: text("linked_account_id"),
    color: text("color"),
    icon: text("icon"),
    isActive: integer("is_active", { mode: "boolean" })
      .notNull()
      .default(true),
    includeInNetWorth: integer("include_in_net_worth", { mode: "boolean" })
      .notNull()
      .default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("accounts_profile_idx").on(table.profileId)]
);

export const categories = sqliteTable(
  "categories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type", { enum: CATEGORY_TYPES }).notNull(),
    icon: text("icon"),
    color: text("color"),
    parentId: text("parent_id"),
    isActive: integer("is_active", { mode: "boolean" })
      .notNull()
      .default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("categories_profile_idx").on(table.profileId),
    index("categories_parent_idx").on(table.parentId),
  ]
);

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    type: text("type", { enum: TRANSACTION_TYPES }).notNull(),
    amount: text("amount").notNull(),
    description: text("description"),
    notes: text("notes"),
    date: text("date").notNull(),
    transferId: text("transfer_id"),
    isCleared: integer("is_cleared", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("transactions_profile_idx").on(table.profileId),
    index("transactions_account_idx").on(table.accountId),
    index("transactions_date_idx").on(table.date),
    index("transactions_transfer_idx").on(table.transferId),
  ]
);

export const profilesRelations = relations(profiles, ({ many }) => ({
  accounts: many(accounts),
  categories: many(categories),
  transactions: many(transactions),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [accounts.profileId],
    references: [profiles.id],
  }),
  transactions: many(transactions),
  transfersTo: many(transactions, {
    relationName: "transfersTo",
  }),
  linkedAccount: one(accounts, {
    fields: [accounts.linkedAccountId],
    references: [accounts.id],
    relationName: "linkedAccount",
  }),
  linkedAccounts: many(accounts, {
    relationName: "linkedAccount",
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [categories.profileId],
    references: [profiles.id],
  }),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "subcategories",
  }),
  subcategories: many(categories, {
    relationName: "subcategories",
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  profile: one(profiles, {
    fields: [transactions.profileId],
    references: [profiles.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
