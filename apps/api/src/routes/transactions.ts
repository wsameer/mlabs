import { Hono } from "hono";
import { z } from "zod/v4";
import {
  CreateTransactionSchema,
  BulkCreateTransactionsSchema,
  TransactionQuerySchema,
  UpdateIncomeExpenseSchema,
  UpdateTransferSchema,
} from "@workspace/types";
import type {
  ApiResponse,
  Transaction,
  TransactionQuery,
  BulkCreateTransactions,
  BulkImportResult,
  CreateIncomeExpense,
  CreateTransfer,
  UpdateIncomeExpense,
  UpdateTransfer,
} from "@workspace/types";

import { validate } from "../middleware/validator.js";
import type { ProfileEnv } from "../middleware/profile.js";
import { transactionsService } from "../services/transactions.service.js";
import { BadRequestError } from "../libs/errors.js";

const transactionsRoute = new Hono<ProfileEnv>();

const TransactionParamsSchema = z.object({
  id: z.uuid(),
});

// Query params come as strings — transform booleans and numbers
const TransactionQueryRouteSchema = TransactionQuerySchema.extend({
  isCleared: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  limit: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().min(1).max(100))
    .optional(),
  offset: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().min(0))
    .optional(),
});

// ---------------------------------------------------------------------------
// GET /  — List transactions with filters & pagination
// ---------------------------------------------------------------------------
transactionsRoute.get(
  "/",
  validate("query", TransactionQueryRouteSchema),
  async (c) => {
    const profileId = c.get("profileId");
    const filters = c.req.valid("query") as TransactionQuery;
    const result = await transactionsService.listTransactions(
      profileId,
      filters
    );

    const response: ApiResponse<{
      transactions: Transaction[];
      total: number;
    }> = {
      success: true,
      data: result,
    };

    return c.json(response);
  }
);

// ---------------------------------------------------------------------------
// GET /:id  — Get single transaction
// ---------------------------------------------------------------------------
transactionsRoute.get(
  "/:id",
  validate("param", TransactionParamsSchema),
  async (c) => {
    const profileId = c.get("profileId");
    const { id } = c.req.valid("param");
    const transaction = await transactionsService.getTransactionById(
      profileId,
      id
    );

    const response: ApiResponse<Transaction> = {
      success: true,
      data: transaction,
    };

    return c.json(response);
  }
);

// ---------------------------------------------------------------------------
// POST /bulk  — Bulk import transactions (income/expense only)
// ---------------------------------------------------------------------------
transactionsRoute.post(
  "/bulk",
  validate("json", BulkCreateTransactionsSchema),
  async (c) => {
    const profileId = c.get("profileId");
    const payload = c.req.valid("json") as BulkCreateTransactions;
    const result = await transactionsService.bulkCreateIncomeExpense(
      profileId,
      payload.transactions
    );

    const response: ApiResponse<BulkImportResult> = {
      success: true,
      data: result,
    };

    return c.json(response, 201);
  }
);

// ---------------------------------------------------------------------------
// POST /  — Create transaction (income/expense or transfer)
// ---------------------------------------------------------------------------
transactionsRoute.post(
  "/",
  validate("json", CreateTransactionSchema),
  async (c) => {
    const profileId = c.get("profileId");
    const payload = c.req.valid("json");

    if (payload.type === "TRANSFER") {
      const transferPayload = payload as CreateTransfer;
      const created = await transactionsService.createTransfer(
        profileId,
        transferPayload
      );

      const response: ApiResponse<Transaction[]> = {
        success: true,
        data: created,
      };

      return c.json(response, 201);
    }

    // INCOME or EXPENSE
    const incomeExpensePayload = payload as CreateIncomeExpense;
    const created = await transactionsService.createIncomeExpense(
      profileId,
      incomeExpensePayload
    );

    const response: ApiResponse<Transaction> = {
      success: true,
      data: created,
    };

    return c.json(response, 201);
  }
);

// ---------------------------------------------------------------------------
// PATCH /:id  — Update transaction
// ---------------------------------------------------------------------------
transactionsRoute.patch(
  "/:id",
  validate("param", TransactionParamsSchema),
  async (c) => {
    const profileId = c.get("profileId");
    const { id } = c.req.valid("param");

    // We need to know the existing transaction type to pick the right update path.
    // Fetch it first, then validate the body against the appropriate schema.
    const existing = await transactionsService.getTransactionById(
      profileId,
      id
    );

    const body = await c.req.json();

    if (existing.type === "TRANSFER") {
      const parsed = UpdateTransferSchema.safeParse(body);
      if (!parsed.success) {
        throw new BadRequestError("Validation error", "VALIDATION_ERROR");
      }
      const updated = await transactionsService.updateTransfer(
        profileId,
        id,
        parsed.data as UpdateTransfer
      );

      const response: ApiResponse<Transaction[]> = {
        success: true,
        data: updated,
      };

      return c.json(response);
    }

    // INCOME or EXPENSE
    const parsed = UpdateIncomeExpenseSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestError("Validation error", "VALIDATION_ERROR");
    }

    const updated = await transactionsService.updateIncomeExpense(
      profileId,
      id,
      parsed.data as UpdateIncomeExpense
    );

    const response: ApiResponse<Transaction> = {
      success: true,
      data: updated,
    };

    return c.json(response);
  }
);

// ---------------------------------------------------------------------------
// DELETE /:id  — Delete transaction (transfers delete both sides)
// ---------------------------------------------------------------------------
transactionsRoute.delete(
  "/:id",
  validate("param", TransactionParamsSchema),
  async (c) => {
    const profileId = c.get("profileId");
    const { id } = c.req.valid("param");
    const deleted = await transactionsService.deleteTransaction(profileId, id);

    const response: ApiResponse<Transaction[]> = {
      success: true,
      data: deleted,
    };

    return c.json(response);
  }
);

export default transactionsRoute;
