import { accounts, profiles } from "@workspace/db";
import type { Bootstrap } from "@workspace/types";

import { and, asc, count, db, eq } from "../libs/db.js";
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
        hasAccount: false,
      };
    }

    const activeAccounts = await db
      .select({ count: count() })
      .from(accounts)
      .where(
        and(
          eq(accounts.profileId, defaultProfile.id),
          eq(accounts.isActive, true)
        )
      );

    const hasAccount = Number(activeAccounts[0]?.count ?? 0) > 0;

    if (!defaultProfile.isSetupComplete) {
      return {
        status: "onboarding",
        profiles: activeProfiles.map(serializeProfile),
        profile: null,
        hasAccount,
      };
    }

    return {
      status: "ready",
      profile: serializeProfile(defaultProfile),
      profiles: activeProfiles.map(serializeProfile),
      hasAccount,
    };
  }
}

export const bootstrapService = new BootstrapService();
