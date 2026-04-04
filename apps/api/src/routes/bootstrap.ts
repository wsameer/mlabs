import { Hono } from "hono";
import { profiles } from "@workspace/db";
import type { ApiResponse, Bootstrap, Profile } from "@workspace/types";

import { asc, db, eq } from "../libs/db.js";

const bootstrap = new Hono();

function serializeProfile(profile: typeof profiles.$inferSelect): Profile {
  return {
    ...profile,
    icon: profile.icon ?? undefined,
    notes: profile.notes ?? undefined,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

bootstrap.get("/", async (c) => {
  const activeProfiles = await db
    .select()
    .from(profiles)
    .where(eq(profiles.isActive, true))
    .orderBy(asc(profiles.createdAt));

  const defaultProfile =
    activeProfiles.find((profile) => profile.isDefault) ?? null;

  let data: Bootstrap;

  if (!defaultProfile) {
    data = {
      status: activeProfiles.length === 0 ? "onboarding" : "pick",
      profiles: activeProfiles.map(serializeProfile),
      profile: null,
    };
  } else if (!defaultProfile.isSetupComplete) {
    data = {
      status: "onboarding",
      profiles: activeProfiles.map(serializeProfile),
      profile: null,
    };
  } else {
    data = {
      status: "ready",
      profile: serializeProfile(defaultProfile),
      profiles: activeProfiles.map(serializeProfile),
    };
  }

  const response: ApiResponse<Bootstrap> = {
    success: true,
    data,
  };

  return c.json(response);
});

export default bootstrap;
