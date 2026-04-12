import type { FileRoutesByPath } from "@tanstack/react-router";
import type { TimeGrain } from "@workspace/types";

const ROOT_ROUTE = "/";

export const ROOT_ROUTE_PATH = ROOT_ROUTE as keyof FileRoutesByPath;
export const DASHBOARD_ROUTE = "/dashboard" as keyof FileRoutesByPath;
export const TRANSACTIONS_ROUTE = "/transactions" as keyof FileRoutesByPath;
export const ACCOUNTS_ROUTE = "/accounts" as keyof FileRoutesByPath;
export const SETTINGS_ROUTE = "/settings" as keyof FileRoutesByPath;
export const BUDGET_ROUTE = "/budget" as keyof FileRoutesByPath;
export const MAINTENANCE_ROUTE = "/maintenance" as keyof FileRoutesByPath;
export const ONBOARDING_ROUTE = "/onboarding" as keyof FileRoutesByPath;
export const PROFILES_ROUTE = "/profiles" as keyof FileRoutesByPath;

export const ALL_DATA_START = new Date(2022, 3, 1);

export const DEFAULT_GRAIN: TimeGrain = "monthly";
