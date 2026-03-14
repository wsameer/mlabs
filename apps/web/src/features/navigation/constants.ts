import {
  ChartPieIcon,
  EllipsisIcon,
  LifeBuoyIcon,
  MessageCircleQuestionIcon,
  ReceiptTextIcon,
  WalletCardsIcon,
} from "lucide-react";

import {
  ACCOUNTS_ROUTE,
  DASHBOARD_ROUTE,
  SETTINGS_ROUTE,
  TRANSACTIONS_ROUTE,
} from "@/constants";
import type { SideNavigationItem } from "./types";

export const PRIMARY_NAVIGATION_OPTIONS = [
  { icon: ChartPieIcon, title: "Dashboard", path: DASHBOARD_ROUTE },
  {
    icon: ReceiptTextIcon,
    title: "Transactions",
    path: TRANSACTIONS_ROUTE,
  },
  { icon: WalletCardsIcon, title: "Accounts", path: ACCOUNTS_ROUTE },
  { icon: EllipsisIcon, title: "More", path: SETTINGS_ROUTE },
].filter(Boolean) as SideNavigationItem[];

export const SECONDARY_NAV_OPTIONS: SideNavigationItem[] = [
  { icon: MessageCircleQuestionIcon, title: "Feedback", path: "#" },
  { icon: LifeBuoyIcon, title: "Support", path: "#" },
];
