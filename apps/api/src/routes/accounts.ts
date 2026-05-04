import { Hono } from "hono";
import { z } from "zod/v4";
import {
  AccountQuerySchema,
  CreateAccountSchema,
  UpdateAccountSchema,
} from "@workspace/types";
import type {
  Account,
  AccountQuery,
  ApiResponse,
  CreateAccount,
  UpdateAccount,
} from "@workspace/types";

import { validate } from "../middleware/validator.js";
import type { ProfileEnv } from "../middleware/profile.js";
import { accountsService } from "../services/accounts.service.js";

const accountsRoute = new Hono<ProfileEnv>();
const AccountParamsSchema = z.object({
  id: z.uuid(),
});

const AccountQueryRouteSchema = AccountQuerySchema.extend({
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  includeInNetWorth: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

accountsRoute.get(
  "/",
  validate("query", AccountQueryRouteSchema),
  async (c) => {
    const profileId = c.get("profileId");
    const filters = c.req.valid("query") as AccountQuery;
    const accountList = await accountsService.listAccounts(profileId, filters);

    const response: ApiResponse<Account[]> = {
      success: true,
      data: accountList,
    };

    return c.json(response);
  }
);

accountsRoute.get("/:id", validate("param", AccountParamsSchema), async (c) => {
  const profileId = c.get("profileId");
  const { id } = c.req.valid("param");
  const account = await accountsService.getAccountById(profileId, id);

  const response: ApiResponse<Account> = {
    success: true,
    data: account,
  };

  return c.json(response);
});

accountsRoute.post("/", validate("json", CreateAccountSchema), async (c) => {
  const payload = c.req.valid("json") as CreateAccount;
  const profileId = c.get("profileId");
  const createdAccount = await accountsService.createAccount(
    profileId,
    payload
  );

  const response: ApiResponse<Account> = {
    success: true,
    data: createdAccount,
  };

  return c.json(response, 201);
});

accountsRoute.patch(
  "/:id",
  validate("param", AccountParamsSchema),
  validate("json", UpdateAccountSchema),
  async (c) => {
    const profileId = c.get("profileId");
    const { id } = c.req.valid("param");
    const payload = c.req.valid("json") as UpdateAccount;
    const updatedAccount = await accountsService.updateAccount(
      profileId,
      id,
      payload
    );

    const response: ApiResponse<Account> = {
      success: true,
      data: updatedAccount,
    };

    return c.json(response);
  }
);

accountsRoute.delete(
  "/:id",
  validate("param", AccountParamsSchema),
  async (c) => {
    const profileId = c.get("profileId");
    const { id } = c.req.valid("param");
    const deletedAccount = await accountsService.deleteAccount(profileId, id);

    const response: ApiResponse<Account> = {
      success: true,
      data: deletedAccount,
    };

    return c.json(response);
  }
);

export default accountsRoute;
