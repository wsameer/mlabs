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
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Enums

export const categoryTypeEnum = pgEnum("category_type", ["INCOME", "EXPENSE"]);

export const currencyEnum = pgEnum("currency", ["USD", "CAD", "GBP"]);

export const dateFormatEnum = pgEnum("date_format", [
  "MM/DD/YYYY",
  "DD/MM/YYYY",
  "YYYY-MM-DD",
]);

// Profiles Table (UI: "Space")

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Identity
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  name: varchar("name", { length: 100 }).notNull(), // Space name / display name
  icon: varchar("icon", { length: 10 }), // Emoji character
  description: text("description"),
  // Preferences
  currency: currencyEnum("currency").notNull().default("CAD"),
  dateFormat: dateFormatEnum("date_format").notNull().default("MM/DD/YYYY"),
  aiAssistantEnabled: boolean("ai_assistant_enabled").notNull().default(false),
  // Status flags
  isDefault: boolean("is_default").notNull().default(false),
  isSetupComplete: boolean("is_setup_complete").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const profilesRelations = relations(profiles, ({ many }) => ({
  accounts: many(accounts),
  categories: many(categories),
  transactions: many(transactions),
  budgets: many(budgets),
}));

export const accountTypeEnum = pgEnum("account_type", [
  "CHEQUING",
  "SAVINGS",
  "CREDIT_CARD",
  "RRSP",
  "FHSA",
  "RESP",
  "TFSA",
  "NON_REGISTERED",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "INCOME",
  "EXPENSE",
  "TRANSFER",
]);

export const budgetPeriodEnum = pgEnum("budget_period", [
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
  "CUSTOM",
]);

// Categories Table

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  type: categoryTypeEnum("type").notNull(),
  color: varchar("color", { length: 7 }),
  icon: varchar("icon", { length: 50 }),
  parentId: uuid("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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

// Accounts Table

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  type: accountTypeEnum("type").notNull(),
  balance: numeric("balance", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  currency: varchar("currency", { length: 3 }).notNull().default("CAD"),
  color: varchar("color", { length: 7 }),
  icon: varchar("icon", { length: 50 }),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  // For credit cards: the default account used to pay off this card
  defaultPaymentAccountId: uuid("default_payment_account_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [accounts.profileId],
    references: [profiles.id],
  }),
  transactions: many(transactions),
  transfersFrom: many(transactions, {
    relationName: "transfersFrom",
  }),
  // Self-reference: credit card -> payment account
  defaultPaymentAccount: one(accounts, {
    fields: [accounts.defaultPaymentAccountId],
    references: [accounts.id],
    relationName: "creditCardPayments",
  }),
  // Inverse: accounts that pay off credit cards
  creditCardsUsingThisAccount: many(accounts, {
    relationName: "creditCardPayments",
  }),
}));

// Transactions Table

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  description: varchar("description", { length: 200 }).notNull(),
  notes: text("notes"),
  date: timestamp("date").notNull(),
  // For transfers
  toAccountId: uuid("to_account_id").references(() => accounts.id, {
    onDelete: "set null",
  }),
  // Additional metadata
  tags: text("tags")
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  receiptUrl: text("receipt_url"),
  isReconciled: boolean("is_reconciled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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
  toAccount: one(accounts, {
    fields: [transactions.toAccountId],
    references: [accounts.id],
    relationName: "transfersFrom",
  }),
}));

// Budgets Table

export const budgets = pgTable("budgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  period: budgetPeriodEnum("period").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const budgetsRelations = relations(budgets, ({ one }) => ({
  profile: one(profiles, {
    fields: [budgets.profileId],
    references: [profiles.id],
  }),
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

// Type exports for convenience

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;
