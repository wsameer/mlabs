import { accounts } from "@workspace/db";
import type { Account, CreateAccount } from "@workspace/types";

import { db } from "../libs/db.js";
import { InternalServerError } from "../libs/errors.js";
import { serializeAccount } from "./account-serializer.js";

export class AccountsService {
  async createAccount(
    profileId: string,
    payload: CreateAccount
  ): Promise<Account> {
    const insertedAccounts = await db
      .insert(accounts)
      .values({
        profileId,
        name: payload.name,
        group: payload.group,
        balance: payload.balance ?? "0",
        currency: payload.currency,
        originalAmount: payload.originalAmount,
        interestRate: payload.interestRate,
        nextPaymentDate: payload.nextPaymentDate,
        linkedAccountId: payload.linkedAccountId,
        color: payload.color,
        icon: payload.icon,
        isActive: payload.isActive,
        includeInNetWorth: payload.includeInNetWorth,
        sortOrder: payload.sortOrder,
        notes: payload.notes,
      })
      .returning();

    const account = insertedAccounts[0];

    if (!account) {
      throw new InternalServerError(
        "Failed to create account",
        "ACCOUNT_CREATE_FAILED"
      );
    }

    return serializeAccount(account);
  }
}

export const accountsService = new AccountsService();
