import { profiles } from "@workspace/db";
import type { Profile } from "@workspace/types";

export function serializeProfile(
  profile: typeof profiles.$inferSelect
): Profile {
  return {
    ...profile,
    icon: profile.icon ?? undefined,
    notes: profile.notes ?? undefined,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
