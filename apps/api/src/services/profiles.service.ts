import { accounts, profiles } from "@workspace/db";
import type { CreateOnboardingProfile, Profile } from "@workspace/types";

import { db, eq, sql } from "../libs/db.js";
import { ConflictError, InternalServerError } from "../libs/errors.js";
import { serializeProfile } from "./profile-serializer.js";

export class ProfilesService {
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
}

export const profilesService = new ProfilesService();
