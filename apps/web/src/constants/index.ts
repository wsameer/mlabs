import type { FileRoutesByPath } from "@tanstack/react-router";
import type { TimeGrain } from "@workspace/types";

const ROOT_ROUTE = "/";

export const DASHBOARD_ROUTE = ROOT_ROUTE as keyof FileRoutesByPath;
export const TRANSACTIONS_ROUTE = "/transactions" as keyof FileRoutesByPath;
export const ACCOUNTS_ROUTE = "/accounts" as keyof FileRoutesByPath;
export const SETTINGS_ROUTE = "/settings" as keyof FileRoutesByPath;
export const MAINTENANCE_ROUTE = "/maintenance" as keyof FileRoutesByPath;

export const ALL_DATA_START = new Date("2022-04-01");

export const DEFAULT_GRAIN: TimeGrain = "monthly";
