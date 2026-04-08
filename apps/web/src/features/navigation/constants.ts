import {
  ArrowRightLeftIcon,
  EllipsisIcon,
  HeadsetIcon,
  LayoutDashboardIcon,
  MessageCircleQuestionIcon,
  PiggyBankIcon,
  WalletCardsIcon,
} from "lucide-react";

import {
  ACCOUNTS_ROUTE,
  BUDGET_ROUTE,
  DASHBOARD_ROUTE,
  SETTINGS_ROUTE,
  TRANSACTIONS_ROUTE,
} from "@/constants";
import type { SideNavigationItem } from "./types";

export const PRIMARY_NAVIGATION_OPTIONS = [
  { icon: LayoutDashboardIcon, title: "Dashboard", path: DASHBOARD_ROUTE },
  {
    icon: ArrowRightLeftIcon,
    title: "Transactions",
    path: TRANSACTIONS_ROUTE,
  },
  { icon: WalletCardsIcon, title: "Accounts", path: ACCOUNTS_ROUTE },
  {
    icon: PiggyBankIcon,
    title: "Budget",
    path: BUDGET_ROUTE,
  },
  { icon: EllipsisIcon, title: "More", path: SETTINGS_ROUTE },
].filter(Boolean) as SideNavigationItem[];

export const SECONDARY_NAV_OPTIONS: SideNavigationItem[] = [
  { icon: MessageCircleQuestionIcon, title: "Feedback", path: "#" },
  { icon: HeadsetIcon, title: "Support", path: "#" },
];
