import type { FileRoutesByPath } from "@tanstack/react-router";

import type { TimeGrain } from "@workspace/types";

const ROOT_ROUTE = "/";

export const DASHBOARD_ROUTE = ROOT_ROUTE as keyof FileRoutesByPath;
export const TRANSACTIONS_ROUTE = "/transactions" as keyof FileRoutesByPath;
export const ACCOUNTS_ROUTE = "/accounts" as keyof FileRoutesByPath;
export const SETTINGS_ROUTE = "/settings" as keyof FileRoutesByPath;

export const GRAIN_OPTIONS: { label: string; value: TimeGrain }[] = [
  { label: "D", value: "daily" },
  { label: "M", value: "monthly" },
  { label: "Y", value: "yearly" },
  { label: "YTD", value: "ytd" },
  { label: "All", value: "all" },
];
