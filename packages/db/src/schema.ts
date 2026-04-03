import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  integer,
  numeric,
  text,
  pgEnum,
  uniqueIndex,
  index,
  date,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ============================================================================
// Enums
// ============================================================================

export const dateFormatEnum = pgEnum("date_format", [
  "D MMM, YYYY", // 12 Aug, 2025  ← default
  "DD/MM/YYYY", // 12/08/2025
  "MM/DD/YYYY", // 08/12/2025
  "YYYY-MM-DD", // 2025-08-12
]);

export const weekStartEnum = pgEnum("week_start", ["SUNDAY", "MONDAY"]);

export const profileTypeEnum = pgEnum("profile_type", [
  "PERSONAL",
  "BUSINESS",
  "SHARED",
]);

export const accountGroupEnum = pgEnum("account_group", [
  "checking", // chequing / current accounts
  "savings", // savings, HYSA, ISA, GIC / term deposits
  "cash", // physical cash, e-wallets
  "credit_card", // credit & charge cards
  "investment", // brokerage, RRSP, TFSA, 401k, pension
  "loan", // personal, auto, student loans
  "mortgage", // home loans — separate for net worth equity calc
  "asset", // property, vehicles, valuables (non-liquid)
  "other",
]);

export const categoryTypeEnum = pgEnum("category_type", ["INCOME", "EXPENSE"]);
// TRANSFER has no category — type is implicit from transaction

export const transactionTypeEnum = pgEnum("transaction_type", [
  "INCOME",
  "EXPENSE",
  "TRANSFER",
]);

// ============================================================================
// Profiles
// ============================================================================

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    icon: varchar("icon", { length: 10 }), // Emoji
    type: profileTypeEnum("type").notNull().default("PERSONAL"),

    // Regional preferences
    currency: varchar("currency", { length: 3 }).notNull().default("CAD"),
    dateFormat: dateFormatEnum("date_format").notNull().default("D MMM, YYYY"),
    weekStart: weekStartEnum("week_start").notNull().default("MONDAY"),
    timezone: varchar("timezone", { length: 50 })
      .notNull()
      .default("America/Toronto"),

    // State
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    isSetupComplete: boolean("is_setup_complete").notNull().default(false),

    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("profiles_is_default_idx")
      .on(table.isDefault)
      .where(sql`is_default = true`),
    index("profiles_active_idx").on(table.isActive),
  ]
);

export const profilesRelations = relations(profiles, ({ many }) => ({
  accounts: many(accounts),
  categories: many(categories),
  transactions: many(transactions),
}));

// ============================================================================
// Accounts
// ============================================================================

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 100 }).notNull(),
    group: accountGroupEnum("group").notNull(),

    // Negative for liabilities (loans, mortgages, credit cards)
    balance: numeric("balance", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    currency: varchar("currency", { length: 3 }).notNull().default("CAD"),

    // Loan / mortgage extras — nullable, ignored for other groups
    originalAmount: numeric("original_amount", { precision: 15, scale: 2 }),
    interestRate: numeric("interest_rate", { precision: 5, scale: 4 }), // 0.0525 = 5.25%
    nextPaymentDate: date("next_payment_date"),

    // credit card → payment account, mortgage → property asset account
    linkedAccountId: uuid("linked_account_id"),

    // Display
    color: varchar("color", { length: 7 }),
    icon: varchar("icon", { length: 50 }),

    // Behaviour
    isActive: boolean("is_active").notNull().default(true),
    includeInNetWorth: boolean("include_in_net_worth").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    notes: text("notes"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("accounts_profile_idx").on(table.profileId)]
);

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

// ============================================================================
// Categories
// ============================================================================

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 100 }).notNull(),
    type: categoryTypeEnum("type").notNull(), // INCOME or EXPENSE only
    icon: varchar("icon", { length: 50 }),
    color: varchar("color", { length: 7 }),

    // One level of nesting — parent is always a root category
    parentId: uuid("parent_id"),

    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("categories_profile_idx").on(table.profileId),
    index("categories_parent_idx").on(table.parentId),
  ]
);

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

// ============================================================================
// Transactions
// ============================================================================

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),

    // null for TRANSFER transactions
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),

    type: transactionTypeEnum("type").notNull(),

    // Always positive — type + account side determines direction
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),

    // Short memo shown in transaction list
    description: varchar("description", { length: 200 }),

    // Long-form optional detail
    notes: text("notes"),

    date: date("date").notNull(),

    // Double-entry transfers: both records share this UUID
    // null for INCOME / EXPENSE
    transferId: uuid("transfer_id"),

    isCleared: boolean("is_cleared").notNull().default(false),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("transactions_profile_idx").on(table.profileId),
    index("transactions_account_idx").on(table.accountId),
    index("transactions_date_idx").on(table.date),
    index("transactions_transfer_idx").on(table.transferId),
  ]
);

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

// ============================================================================
// Type exports
// ============================================================================

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
