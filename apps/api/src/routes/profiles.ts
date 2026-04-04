import { Hono } from "hono";
import { accounts, profiles } from "@workspace/db";
import { CreateOnboardingProfileSchema } from "@workspace/types";
import type {
  ApiResponse,
  CreateOnboardingProfile,
  Profile,
} from "@workspace/types";

import { db, eq } from "../libs/db.js";
import { validate } from "../middleware/validator.js";

const profilesRoute = new Hono();

function serializeProfile(profile: typeof profiles.$inferSelect): Profile {
  return {
    ...profile,
    icon: profile.icon ?? undefined,
    notes: profile.notes ?? undefined,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

profilesRoute.post(
  "/",
  validate("json", CreateOnboardingProfileSchema),
  async (c) => {
    const payload = c.req.valid("json") as CreateOnboardingProfile;

    const createdProfile = await db.transaction(async (tx) => {
      await tx
        .update(profiles)
        .set({
          isDefault: false,
          updatedAt: new Date(),
        })
        .where(eq(profiles.isDefault, true));

      const createdProfiles = await tx
        .insert(profiles)
        .values({
          name: payload.name,
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

      const profile = createdProfiles[0];

      if (!profile) {
        throw new Error("Failed to create profile");
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

    const response: ApiResponse<Profile> = {
      success: true,
      data: serializeProfile(createdProfile),
    };

    return c.json(response, 201);
  }
);

export default profilesRoute;
