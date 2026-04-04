import { profiles } from "@workspace/db";
import type { Bootstrap } from "@workspace/types";

import { asc, db, eq } from "../libs/db.js";
import { serializeProfile } from "./profile-serializer.js";

export class BootstrapService {
  async getAppBootstrap(): Promise<Bootstrap> {
    const activeProfiles = await db
      .select()
      .from(profiles)
      .where(eq(profiles.isActive, true))
      .orderBy(asc(profiles.createdAt));

    const defaultProfile =
      activeProfiles.find((profile) => profile.isDefault) ?? null;

    if (!defaultProfile) {
      return {
        status: activeProfiles.length === 0 ? "onboarding" : "pick",
        profiles: activeProfiles.map(serializeProfile),
        profile: null,
      };
    }

    if (!defaultProfile.isSetupComplete) {
      return {
        status: "onboarding",
        profiles: activeProfiles.map(serializeProfile),
        profile: null,
      };
    }

    return {
      status: "ready",
      profile: serializeProfile(defaultProfile),
      profiles: activeProfiles.map(serializeProfile),
    };
  }
}

export const bootstrapService = new BootstrapService();
