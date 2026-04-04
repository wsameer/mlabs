import { accounts, eq, and, desc } from "@workspace/db";
import type {
  InsertAccount,
  UpdateAccount,
  AccountQuery,
} from "@workspace/types";
import { db } from "src/libs/db.js";
import { AppError } from "src/libs/errors.js";

/**
 * Accounts Service
 * Handles all business logic for account operations
 */

export class AccountsService {
  /**
   * Get all accounts with optional filtering
   */
  async getAll(profileId: string, filters?: AccountQuery) {
    const conditions = [eq(accounts.profileId, profileId)];

    if (filters?.type) {
      conditions.push(eq(accounts.type, filters.type));
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(accounts.isActive, filters.isActive));
    }

    const result = await db
      .select()
      .from(accounts)
      .where(and(...conditions))
      .orderBy(accounts.sortOrder, desc(accounts.createdAt));

    return result;
  }

  /**
   * Get a single account by ID
   */
  async getById(profileId: string, id: string) {
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.profileId, profileId)))
      .limit(1);

    if (!account) {
      throw new AppError(404, "Account not found", "ACCOUNT_NOT_FOUND");
    }

    return account;
  }

  /**
   * Get account balance (useful for separate balance endpoint)
   */
  async getBalance(profileId: string, id: string) {
    const account = await this.getById(profileId, id);
    return {
      accountId: account.id,
      balance: parseFloat(account.balance),
      currency: account.currency,
    };
  }

  /**
   * Create a new account
   */
  async create(profileId: string, data: InsertAccount) {
    const [newAccount] = await db
      .insert(accounts)
      .values({
        ...data,
        profileId,
        // Convert balance to string if provided (database uses numeric/string)
        balance: data.balance !== undefined ? String(data.balance) : undefined,
        updatedAt: new Date(),
      })
      .returning();

    return newAccount;
  }

  /**
   * Update an existing account
   */
  async update(profileId: string, id: string, data: UpdateAccount) {
    // Check if account exists and belongs to profile
    await this.getById(profileId, id);

    const [updatedAccount] = await db
      .update(accounts)
      .set({
        ...data,
        // Convert balance to string if provided (database uses numeric/string)
        balance: data.balance !== undefined ? String(data.balance) : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(accounts.id, id), eq(accounts.profileId, profileId)))
      .returning();

    return updatedAccount;
  }

  /**
   * Delete an account (soft delete by setting isActive = false)
   */
  async delete(profileId: string, id: string) {
    // Check if account exists and belongs to profile
    await this.getById(profileId, id);

    // Soft delete
    const [deletedAccount] = await db
      .update(accounts)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(eq(accounts.id, id), eq(accounts.profileId, profileId)))
      .returning();

    return deletedAccount;
  }

  /**
   * Permanently delete an account (use with caution)
   * Note: This will cascade delete all related transactions
   */
  async hardDelete(profileId: string, id: string) {
    // Check if account exists and belongs to profile
    await this.getById(profileId, id);

    await db
      .delete(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.profileId, profileId)));

    return { success: true, message: "Account permanently deleted" };
  }

  /**
   * Calculate total balance across all active accounts
   */
  async getTotalBalance(profileId: string) {
    const activeAccounts = await db
      .select()
      .from(accounts)
      .where(
        and(eq(accounts.isActive, true), eq(accounts.profileId, profileId))
      );

    const total = activeAccounts.reduce((sum, account) => {
      return sum + parseFloat(account.balance);
    }, 0);

    return {
      total,
      currency: "USD", // Could be enhanced to handle multiple currencies
      accountCount: activeAccounts.length,
    };
  }
}

// Export singleton instance
export const accountsService = new AccountsService();
