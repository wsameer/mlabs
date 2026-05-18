import {
  accounts,
  categories,
  profiles,
  seedCategoriesForProfile,
  transactions,
} from "@workspace/db";
import type {
  CreateOnboardingProfile,
  Profile,
  UpdateProfile,
} from "@workspace/types";

import { db, eq, sql } from "../libs/db.js";
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
} from "../libs/errors.js";
import { serializeProfile } from "./profile-serializer.js";

function namesMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export class ProfilesService {
  private normalizeNotes(notes: string | undefined) {
    return notes?.slice(0, 160);
  }

  async getProfileById(id: string): Promise<Profile> {
    const existingProfiles = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);

    const profile = existingProfiles[0];

    if (!profile) {
      throw new NotFoundError("Profile not found", "PROFILE_NOT_FOUND");
    }

    return serializeProfile(profile);
  }

  async isWorkspaceNameAvailable(name: string): Promise<boolean> {
    const normalizedName = name.trim().toLowerCase();

    const existingProfiles = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(sql`lower(${profiles.name}) = ${normalizedName}`)
      .limit(1);

    return existingProfiles.length === 0;
  }

  async createOnboardingProfile(
    payload: CreateOnboardingProfile
  ): Promise<Profile> {
    const createdProfile = await db.transaction(async (tx) => {
      const normalizedName = payload.name.trim().toLowerCase();

      const existingProfiles = await tx
        .select({ id: profiles.id })
        .from(profiles)
        .where(sql`lower(${profiles.name}) = ${normalizedName}`)
        .limit(1);

      if (existingProfiles.length > 0) {
        throw new ConflictError(
          "Workspace name is already in use",
          "WORKSPACE_NAME_TAKEN"
        );
      }

      await tx
        .update(profiles)
        .set({
          isDefault: false,
          updatedAt: new Date(),
        })
        .where(eq(profiles.isDefault, true));

      const insertedProfiles = await tx
        .insert(profiles)
        .values({
          name: payload.name.trim(),
          icon: payload.icon,
          type: payload.type,
          currency: payload.currency,
          dateFormat: payload.dateFormat,
          weekStart: payload.weekStart,
          timezone: payload.timezone,
          isDefault: true,
          isSetupComplete: true,
        })
        .returning();

      const profile = insertedProfiles[0];

      if (!profile) {
        throw new InternalServerError(
          "Failed to create profile",
          "PROFILE_CREATE_FAILED"
        );
      }

      // Seed default categories
      await seedCategoriesForProfile(tx, profile.id);

      if (payload.firstAccount) {
        await tx.insert(accounts).values({
          profileId: profile.id,
          name: payload.firstAccount.name,
          group: payload.firstAccount.group,
          balance: payload.firstAccount.balance,
          currency: payload.currency,
        });
      }

      return profile;
    });

    return serializeProfile(createdProfile);
  }

  async updateProfile(id: string, payload: UpdateProfile): Promise<Profile> {
    const updateValues = {
      ...(payload.icon !== undefined ? { icon: payload.icon } : {}),
      ...(payload.type !== undefined ? { type: payload.type } : {}),
      ...(payload.currency !== undefined ? { currency: payload.currency } : {}),
      ...(payload.dateFormat !== undefined
        ? { dateFormat: payload.dateFormat }
        : {}),
      ...(payload.weekStart !== undefined
        ? { weekStart: payload.weekStart }
        : {}),
      ...(payload.notes !== undefined
        ? { notes: this.normalizeNotes(payload.notes) }
        : {}),
      updatedAt: new Date(),
    };

    const updatedProfiles = await db
      .update(profiles)
      .set(updateValues)
      .where(eq(profiles.id, id))
      .returning();

    const updatedProfile = updatedProfiles[0];

    if (!updatedProfile) {
      throw new NotFoundError("Profile not found", "PROFILE_NOT_FOUND");
    }

    return serializeProfile(updatedProfile);
  }

  async deleteProfile(id: string, confirmName: string): Promise<void> {
    await db.transaction(async (tx) => {
      const [profile] = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.id, id))
        .limit(1);

      if (!profile) {
        throw new NotFoundError("Profile not found", "PROFILE_NOT_FOUND");
      }

      if (!namesMatch(profile.name, confirmName)) {
        throw new BadRequestError(
          "Workspace name does not match",
          "NAME_MISMATCH"
        );
      }

      // FK cascades remove accounts, categories, and transactions.
      const deleted = await tx
        .delete(profiles)
        .where(eq(profiles.id, id))
        .returning({ id: profiles.id });

      if (deleted.length === 0) {
        throw new InternalServerError(
          "Failed to delete profile",
          "PROFILE_DELETE_FAILED"
        );
      }

      // Promote another profile to default if one exists, so bootstrap can
      // resolve to "ready" or "pick" instead of nothing.
      if (profile.isDefault) {
        const [next] = await tx
          .select({ id: profiles.id })
          .from(profiles)
          .where(eq(profiles.isActive, true))
          .limit(1);

        if (next) {
          await tx
            .update(profiles)
            .set({ isDefault: true, updatedAt: new Date() })
            .where(eq(profiles.id, next.id));
        }
      }
    });
  }

  async clearTransactions(id: string, confirmName: string): Promise<void> {
    await db.transaction(async (tx) => {
      const [profile] = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.id, id))
        .limit(1);

      if (!profile) {
        throw new NotFoundError("Profile not found", "PROFILE_NOT_FOUND");
      }

      if (!namesMatch(profile.name, confirmName)) {
        throw new BadRequestError(
          "Workspace name does not match",
          "NAME_MISMATCH"
        );
      }

      await tx.delete(transactions).where(eq(transactions.profileId, id));

      await tx
        .update(accounts)
        .set({ balance: "0", updatedAt: new Date() })
        .where(eq(accounts.profileId, id));
    });
  }

  async factoryReset(id: string, confirmName: string): Promise<void> {
    await db.transaction(async (tx) => {
      const [profile] = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.id, id))
        .limit(1);

      if (!profile) {
        throw new NotFoundError("Profile not found", "PROFILE_NOT_FOUND");
      }

      if (!namesMatch(profile.name, confirmName)) {
        throw new BadRequestError(
          "Workspace name does not match",
          "NAME_MISMATCH"
        );
      }

      await tx.delete(transactions).where(eq(transactions.profileId, id));
      await tx.delete(accounts).where(eq(accounts.profileId, id));
      await tx.delete(categories).where(eq(categories.profileId, id));

      await seedCategoriesForProfile(tx, id);
    });
  }
}

export const profilesService = new ProfilesService();
