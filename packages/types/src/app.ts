// ============================================================================
// App-level types (non-database)
// ============================================================================

import { AccountGroupSchema } from "./schema.js";

export type TimeGrain = "daily" | "weekly" | "monthly" | "yearly" | "all";

export type BackendStatus = "connected" | "disconnected" | "checking";

export type DateRange = {
  from: Date;
  to: Date;
};

export type DateNavDirections = "prev" | "next";

export const ACCOUNT_GROUPS = AccountGroupSchema.options;
