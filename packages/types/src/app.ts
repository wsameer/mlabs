import z from "zod";

// ============================================================================
// App-level types (non-database)
// ============================================================================

export type TimeGrain = "daily" | "weekly" | "monthly" | "yearly" | "all";

export type DateRange = {
  from: Date;
  to: Date;
};

export type DateNavDirections = "prev" | "next";
