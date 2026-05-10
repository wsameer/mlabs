import {
  ArrowRightLeftIcon,
  LayoutDashboardIcon,
  PiggyBankIcon,
  RepeatIcon,
  SettingsIcon,
  TagsIcon,
  TargetIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react";

import {
  ACCOUNTS_ROUTE,
  BUDGET_ROUTE,
  CATEGORIES_ROUTE,
  DASHBOARD_ROUTE,
  GOALS_ROUTE,
  NET_WORTH_ROUTE,
  SETTINGS_ROUTE,
  SUBSCRIPTIONS_ROUTE,
  TRANSACTIONS_ROUTE,
} from "@/constants";
import type { SideNavigationItem } from "./types";

export const PRIMARY_NAVIGATION_OPTIONS: SideNavigationItem[] = [
  { icon: LayoutDashboardIcon, title: "Dashboard", path: DASHBOARD_ROUTE },
  { icon: ArrowRightLeftIcon, title: "Transactions", path: TRANSACTIONS_ROUTE },
  { icon: WalletCardsIcon, title: "Accounts", path: ACCOUNTS_ROUTE },
  { icon: PiggyBankIcon, title: "Budget", path: BUDGET_ROUTE },
  { icon: TrendingUpIcon, title: "Net Worth", path: NET_WORTH_ROUTE },
  { icon: TargetIcon, title: "Goals", path: GOALS_ROUTE },
  { icon: RepeatIcon, title: "Subscriptions", path: SUBSCRIPTIONS_ROUTE },
  { icon: TagsIcon, title: "Categories", path: CATEGORIES_ROUTE },
  { icon: SettingsIcon, title: "Settings", path: SETTINGS_ROUTE },
];
