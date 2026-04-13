import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type {
  TransactionQuery,
  BulkCreateTransactions,
  CreateIncomeExpense,
  CreateTransfer,
  UpdateIncomeExpense,
  UpdateTransfer,
} from "@workspace/types";

import type { ProfileEnv } from "../middleware/profile.js";
import { transactionsService } from "../services/transactions.service.js";
import { BadRequestError } from "../libs/errors.js";
import {
  apiResponseSchema,
  ErrorResponseSchema,
  IdParamSchema,
  TransactionSchema,
} from "../libs/openapi-schemas.js";

const transactionsRoute = new OpenAPIHono<ProfileEnv>();

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const TransactionQueryRouteSchema = z.object({
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]).optional(),
  startDate: z.string().optional().openapi({ example: "2026-01-01" }),
  endDate: z.string().optional().openapi({ example: "2026-12-31" }),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
  isCleared: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  search: z.string().optional(),
  limit: z.string().transform((v) => Number(v)).pipe(z.number().int().min(1).max(100)).optional(),
  offset: z.string().transform((v) => Number(v)).pipe(z.number().int().min(0)).optional(),
  sortBy: z.enum(["date", "amount", "description"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const CreateTransactionBodySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.string(),
  description: z.string().max(200).optional(),
  notes: z.string().optional(),
  date: z.string(),
  isCleared: z.boolean().default(false),
  // Income/Expense fields
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  // Transfer fields
  fromAccountId: z.string().uuid().optional(),
  toAccountId: z.string().uuid().optional(),
});

const BulkCreateBodySchema = z.object({
  transactions: z
    .array(
      z.object({
        type: z.enum(["INCOME", "EXPENSE"]),
        accountId: z.string().uuid(),
        categoryId: z.string().uuid().optional(),
        amount: z.string(),
        description: z.string().max(200).optional(),
        notes: z.string().optional(),
        date: z.string(),
        isCleared: z.boolean().default(false),
      })
    )
    .min(1)
    .max(500),
});

const UpdateTransactionBodySchema = z.object({
  amount: z.string().optional(),
  description: z.string().max(200).optional(),
  notes: z.string().optional(),
  date: z.string().optional(),
  isCleared: z.boolean().optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().nullable().optional(),
  fromAccountId: z.string().uuid().optional(),
  toAccountId: z.string().uuid().optional(),
});

const BulkImportResultSchema = z.object({
  imported: z.number(),
  failed: z.number(),
  errors: z.array(z.object({ index: z.number(), message: z.string() })),
});

// ---------------------------------------------------------------------------
// GET / — List transactions
// ---------------------------------------------------------------------------

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Transactions"],
  summary: "List transactions",
  description: "Returns paginated transactions with optional filters for date, type, amount, and search.",
  request: { query: TransactionQueryRouteSchema },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z.object({
              transactions: z.array(TransactionSchema),
              total: z.number(),
            })
          ),
        },
      },
      description: "Paginated transaction list",
    },
  },
});

transactionsRoute.openapi(listRoute, async (c) => {
  const profileId = c.get("profileId");
  const filters = c.req.valid("query") as unknown as TransactionQuery;
  const result = await transactionsService.listTransactions(profileId, filters);
  return c.json({ success: true as const, data: result });
});

// ---------------------------------------------------------------------------
// GET /:id — Get single transaction
// ---------------------------------------------------------------------------

const getRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Transactions"],
  summary: "Get transaction by ID",
  request: { params: IdParamSchema },
  responses: {
    200: {
      content: { "application/json": { schema: apiResponseSchema(TransactionSchema) } },
      description: "Transaction details",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Transaction not found",
    },
  },
});

transactionsRoute.openapi(getRoute, async (c) => {
  const profileId = c.get("profileId");
  const { id } = c.req.valid("param");
  const transaction = await transactionsService.getTransactionById(profileId, id);
  return c.json({ success: true as const, data: transaction });
});

// ---------------------------------------------------------------------------
// POST /bulk — Bulk import transactions
// ---------------------------------------------------------------------------

const bulkRoute = createRoute({
  method: "post",
  path: "/bulk",
  tags: ["Transactions"],
  summary: "Bulk import transactions",
  description: "Import multiple income/expense transactions at once (e.g. from CSV). Max 500 per request.",
  request: {
    body: {
      content: { "application/json": { schema: BulkCreateBodySchema } },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: apiResponseSchema(BulkImportResultSchema) } },
      description: "Bulk import result with success and failure counts",
    },
  },
});

transactionsRoute.openapi(bulkRoute, async (c) => {
  const profileId = c.get("profileId");
  const payload = c.req.valid("json") as unknown as BulkCreateTransactions;
  const result = await transactionsService.bulkCreateIncomeExpense(profileId, payload.transactions);
  return c.json({ success: true as const, data: result }, 201);
});

// ---------------------------------------------------------------------------
// POST / — Create transaction (income/expense or transfer)
// ---------------------------------------------------------------------------

const createRoute_ = createRoute({
  method: "post",
  path: "/",
  tags: ["Transactions"],
  summary: "Create transaction",
  description:
    "Creates an income/expense transaction or a transfer. For transfers, provide fromAccountId and toAccountId instead of accountId.",
  request: {
    body: {
      content: { "application/json": { schema: CreateTransactionBodySchema } },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z.union([TransactionSchema, z.array(TransactionSchema)])
          ),
        },
      },
      description: "Transaction created (transfer returns array of both sides)",
    },
  },
});

transactionsRoute.openapi(createRoute_, async (c) => {
  const profileId = c.get("profileId");
  const payload = c.req.valid("json");

  if (payload.type === "TRANSFER") {
    const created = await transactionsService.createTransfer(
      profileId,
      payload as unknown as CreateTransfer
    );
    return c.json({ success: true as const, data: created }, 201);
  }

  const created = await transactionsService.createIncomeExpense(
    profileId,
    payload as unknown as CreateIncomeExpense
  );
  return c.json({ success: true as const, data: created }, 201);
});

// ---------------------------------------------------------------------------
// PATCH /:id — Update transaction
// ---------------------------------------------------------------------------

const updateRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Transactions"],
  summary: "Update transaction",
  description:
    "Updates a transaction. The update schema depends on the existing transaction type (income/expense vs transfer).",
  request: {
    params: IdParamSchema,
    body: {
      content: { "application/json": { schema: UpdateTransactionBodySchema } },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z.union([TransactionSchema, z.array(TransactionSchema)])
          ),
        },
      },
      description: "Transaction updated",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Transaction not found",
    },
  },
});

transactionsRoute.openapi(updateRoute, async (c) => {
  const profileId = c.get("profileId");
  const { id } = c.req.valid("param");
  const existing = await transactionsService.getTransactionById(profileId, id);
  const body = c.req.valid("json");

  if (existing.type === "TRANSFER") {
    const updated = await transactionsService.updateTransfer(
      profileId,
      id,
      body as unknown as UpdateTransfer
    );
    return c.json({ success: true as const, data: updated });
  }

  const updated = await transactionsService.updateIncomeExpense(
    profileId,
    id,
    body as unknown as UpdateIncomeExpense
  );
  return c.json({ success: true as const, data: updated });
});

// ---------------------------------------------------------------------------
// DELETE /:id — Delete transaction
// ---------------------------------------------------------------------------

const deleteRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Transactions"],
  summary: "Delete transaction",
  description: "Deletes a transaction. For transfers, both sides are deleted.",
  request: { params: IdParamSchema },
  responses: {
    200: {
      content: {
        "application/json": { schema: apiResponseSchema(z.array(TransactionSchema)) },
      },
      description: "Deleted transaction(s)",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Transaction not found",
    },
  },
});

transactionsRoute.openapi(deleteRoute, async (c) => {
  const profileId = c.get("profileId");
  const { id } = c.req.valid("param");
  const deleted = await transactionsService.deleteTransaction(profileId, id);
  return c.json({ success: true as const, data: deleted });
});

export default transactionsRoute;
