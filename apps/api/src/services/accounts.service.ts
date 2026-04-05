import { accounts } from "@workspace/db";
import type {
  Account,
  AccountQuery,
  CreateAccount,
  UpdateAccount,
} from "@workspace/types";

import { and, asc, db, desc, eq, sql } from "../libs/db.js";
import { InternalServerError, NotFoundError } from "../libs/errors.js";
import { serializeAccount } from "./account-serializer.js";

export class AccountsService {
  async listAccounts(
    profileId: string,
    filters?: AccountQuery
  ): Promise<Account[]> {
    const conditions = [eq(accounts.profileId, profileId)];

    if (filters?.group) {
      conditions.push(eq(accounts.group, filters.group));
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(accounts.isActive, filters.isActive));
    }

    if (filters?.includeInNetWorth !== undefined) {
      conditions.push(
        eq(accounts.includeInNetWorth, filters.includeInNetWorth)
      );
    }

    if (filters?.search?.trim()) {
      const search = `%${filters.search.trim().toLowerCase()}%`;
      conditions.push(sql`lower(${accounts.name}) like ${search}`);
    }

    const rows = await db
      .select()
      .from(accounts)
      .where(and(...conditions))
      .orderBy(asc(accounts.sortOrder), asc(accounts.createdAt));

    return rows.map(serializeAccount);
  }

  async getAccountById(profileId: string, id: string): Promise<Account> {
    const rows = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.profileId, profileId)))
      .limit(1);

    const account = rows[0];

    if (!account) {
      throw new NotFoundError("Account not found", "ACCOUNT_NOT_FOUND");
    }

    return serializeAccount(account);
  }

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

  async updateAccount(
    profileId: string,
    id: string,
    payload: UpdateAccount
  ): Promise<Account> {
    await this.getAccountById(profileId, id);

    const updates = {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.group !== undefined ? { group: payload.group } : {}),
      ...(payload.balance !== undefined ? { balance: payload.balance } : {}),
      ...(payload.currency !== undefined ? { currency: payload.currency } : {}),
      ...(payload.originalAmount !== undefined
        ? { originalAmount: payload.originalAmount }
        : {}),
      ...(payload.interestRate !== undefined
        ? { interestRate: payload.interestRate }
        : {}),
      ...(payload.nextPaymentDate !== undefined
        ? { nextPaymentDate: payload.nextPaymentDate }
        : {}),
      ...(payload.linkedAccountId !== undefined
        ? { linkedAccountId: payload.linkedAccountId }
        : {}),
      ...(payload.color !== undefined ? { color: payload.color } : {}),
      ...(payload.icon !== undefined ? { icon: payload.icon } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      ...(payload.includeInNetWorth !== undefined
        ? { includeInNetWorth: payload.includeInNetWorth }
        : {}),
      ...(payload.sortOrder !== undefined
        ? { sortOrder: payload.sortOrder }
        : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
      updatedAt: new Date(),
    };

    const updatedRows = await db
      .update(accounts)
      .set(updates)
      .where(and(eq(accounts.id, id), eq(accounts.profileId, profileId)))
      .returning();

    const updatedAccount = updatedRows[0];

    if (!updatedAccount) {
      throw new InternalServerError(
        "Failed to update account",
        "ACCOUNT_UPDATE_FAILED"
      );
    }

    return serializeAccount(updatedAccount);
  }

  async deleteAccount(profileId: string, id: string): Promise<Account> {
    await this.getAccountById(profileId, id);

    const deletedRows = await db
      .delete(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.profileId, profileId)))
      .returning();

    const deletedAccount = deletedRows[0];

    if (!deletedAccount) {
      throw new InternalServerError(
        "Failed to delete account",
        "ACCOUNT_DELETE_FAILED"
      );
    }

    return serializeAccount(deletedAccount);
  }
}

export const accountsService = new AccountsService();
