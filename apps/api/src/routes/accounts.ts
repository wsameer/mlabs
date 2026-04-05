import { Hono } from "hono";
import { CreateAccountSchema } from "@workspace/types";
import type { ApiResponse, Account, CreateAccount } from "@workspace/types";

import { validate } from "../middleware/validator.js";
import type { ProfileEnv } from "../middleware/profile.js";
import { accountsService } from "../services/accounts.service.js";

const accountsRoute = new Hono<ProfileEnv>();

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

export default accountsRoute;
