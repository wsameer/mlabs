// ============================================================================
// App-level types (non-database)
// ============================================================================

import type z from "zod";
import { AccountGroupSchema } from "./api.js";

export type TimeGrain = "daily" | "weekly" | "monthly" | "yearly" | "all";

export type BackendStatus = "connected" | "disconnected" | "checking";

export type DateRange = {
  from: Date;
  to: Date;
};

export type DateNavDirections = "prev" | "next";

export const ACCOUNT_TYPES = AccountGroupSchema.options;
export type AccountType = z.infer<typeof AccountGroupSchema>;
