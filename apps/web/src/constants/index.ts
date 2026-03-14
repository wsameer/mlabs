import type { FileRoutesByPath } from "@tanstack/react-router";

const ROOT_ROUTE = "/";

export const DASHBOARD_ROUTE = ROOT_ROUTE as keyof FileRoutesByPath;
export const TRANSACTIONS_ROUTE = "/transactions" as keyof FileRoutesByPath;
export const ACCOUNTS_ROUTE = "/accounts" as keyof FileRoutesByPath;
export const SETTINGS_ROUTE = "/settings" as keyof FileRoutesByPath;

export const TIMELINE_FILTERS = [
  { label: "This month", value: "month" },
  { label: "One year", value: "year" },
  { label: "YTD", value: "ytd" },
  { label: "All time", value: "all" },
];
