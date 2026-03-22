export type TimeGrain =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "all";

export type DateRange = {
  from: Date;
  to: Date;
};
