import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type {
  AccountQuery,
  CreateAccount,
  UpdateAccount,
} from "@workspace/types";

import type { ProfileEnv } from "../middleware/profile.js";
import { accountsService } from "../services/accounts.service.js";
import {
  apiResponseSchema,
  ErrorResponseSchema,
  IdParamSchema,
  AccountSchema,
} from "../libs/openapi-schemas.js";

const accountsRoute = new OpenAPIHono<ProfileEnv>();

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const AccountQueryRouteSchema = z.object({
  group: z
    .enum([
      "chequing",
      "savings",
      "cash",
      "credit_card",
      "investment",
      "loan",
      "mortgage",
      "asset",
      "other",
    ])
    .optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  includeInNetWorth: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  search: z.string().optional(),
});

const CreateAccountBodySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  group: z.enum([
    "chequing",
    "savings",
    "cash",
    "credit_card",
    "investment",
    "loan",
    "mortgage",
    "asset",
    "other",
  ]),
  balance: z.string().optional(),
  currency: z.string().length(3).default("CAD"),
  institutionName: z.string().max(100).nullable().optional(),
  accountNumber: z.string().max(50).nullable().optional(),
  description: z.string().max(200).nullable().optional(),
  originalAmount: z.string().optional(),
  interestRate: z.string().optional(),
  creditLimit: z.string().nullable().optional(),
  linkedAccountId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  color: z.string().nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  isActive: z.boolean().default(true),
  includeInNetWorth: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  notes: z.string().nullable().optional(),
});

const UpdateAccountBodySchema = CreateAccountBodySchema.partial();

// ---------------------------------------------------------------------------
// GET / — List accounts
// ---------------------------------------------------------------------------

const listAccountsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Accounts"],
  summary: "List accounts",
  description:
    "Returns all accounts for the current profile, with optional filters.",
  request: { query: AccountQueryRouteSchema },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: apiResponseSchema(z.array(AccountSchema)),
        },
      },
      description: "List of accounts",
    },
  },
});

accountsRoute.openapi(listAccountsRoute, async (c) => {
  const profileId = c.get("profileId");
  const filters = c.req.valid("query") as unknown as AccountQuery;
  const accountList = await accountsService.listAccounts(profileId, filters);
  return c.json({ success: true as const, data: accountList });
});

// ---------------------------------------------------------------------------
// GET /:id — Get account by ID
// ---------------------------------------------------------------------------

const getAccountRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Accounts"],
  summary: "Get account by ID",
  request: { params: IdParamSchema },
  responses: {
    200: {
      content: {
        "application/json": { schema: apiResponseSchema(AccountSchema) },
      },
      description: "Account details",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Account not found",
    },
  },
});

accountsRoute.openapi(getAccountRoute, async (c) => {
  const profileId = c.get("profileId");
  const { id } = c.req.valid("param");
  const account = await accountsService.getAccountById(profileId, id);
  return c.json({ success: true as const, data: account }, 200);
});

// ---------------------------------------------------------------------------
// POST / — Create account
// ---------------------------------------------------------------------------

const createAccountRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Accounts"],
  summary: "Create account",
  request: {
    body: {
      content: { "application/json": { schema: CreateAccountBodySchema } },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: apiResponseSchema(AccountSchema) },
      },
      description: "Account created",
    },
  },
});

accountsRoute.openapi(createAccountRoute, async (c) => {
  const profileId = c.get("profileId");
  const payload = c.req.valid("json") as unknown as CreateAccount;
  const createdAccount = await accountsService.createAccount(
    profileId,
    payload
  );
  return c.json({ success: true as const, data: createdAccount }, 201);
});

// ---------------------------------------------------------------------------
// PATCH /:id — Update account
// ---------------------------------------------------------------------------

const updateAccountRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Accounts"],
  summary: "Update account",
  request: {
    params: IdParamSchema,
    body: {
      content: { "application/json": { schema: UpdateAccountBodySchema } },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: apiResponseSchema(AccountSchema) },
      },
      description: "Account updated",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Account not found",
    },
  },
});

accountsRoute.openapi(updateAccountRoute, async (c) => {
  const profileId = c.get("profileId");
  const { id } = c.req.valid("param");
  const payload = c.req.valid("json") as unknown as UpdateAccount;
  const updatedAccount = await accountsService.updateAccount(
    profileId,
    id,
    payload
  );
  return c.json({ success: true as const, data: updatedAccount }, 200);
});

// ---------------------------------------------------------------------------
// DELETE /:id — Delete account
// ---------------------------------------------------------------------------

const deleteAccountRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Accounts"],
  summary: "Delete account",
  request: { params: IdParamSchema },
  responses: {
    200: {
      content: {
        "application/json": { schema: apiResponseSchema(AccountSchema) },
      },
      description: "Account deleted",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Account not found",
    },
  },
});

accountsRoute.openapi(deleteAccountRoute, async (c) => {
  const profileId = c.get("profileId");
  const { id } = c.req.valid("param");
  const deletedAccount = await accountsService.deleteAccount(profileId, id);
  return c.json({ success: true as const, data: deletedAccount }, 200);
});

export default accountsRoute;
