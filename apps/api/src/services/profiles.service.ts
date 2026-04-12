import {
  accounts,
  categories,
  profiles,
  DEFAULT_CATEGORIES,
} from "@workspace/db";
import type {
  CreateOnboardingProfile,
  Profile,
  UpdateProfile,
} from "@workspace/types";

import { db, eq, sql } from "../libs/db.js";
import {
  ConflictError,
  InternalServerError,
  NotFoundError,
} from "../libs/errors.js";
import { serializeProfile } from "./profile-serializer.js";

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
      await tx
        .insert(categories)
        .values(
          DEFAULT_CATEGORIES.map((cat) => ({ ...cat, profileId: profile.id }))
        );

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
}

export const profilesService = new ProfilesService();
