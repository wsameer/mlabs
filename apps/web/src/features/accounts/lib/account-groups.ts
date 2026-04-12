import type { AccountGroup } from "@workspace/types";
import type { LucideIcon } from "lucide-react";
import {
  BuildingIcon,
  PiggyBankIcon,
  BanknoteIcon,
  CreditCardIcon,
  BriefcaseBusinessIcon,
  HandCoinsIcon,
  LandmarkIcon,
  CircleDollarSignIcon,
} from "lucide-react";

export interface AccountGroupMetadata {
  label: string;
  icon: LucideIcon;
  color: string;
  isLiability: boolean;
}

export const ACCOUNT_GROUP_METADATA: Record<
  AccountGroup,
  AccountGroupMetadata
> = {
  chequing: {
    label: "Chequing",
    icon: BuildingIcon,
    color: "hsl(200, 70%, 50%)",
    isLiability: false,
  },
  savings: {
    label: "Savings",
    icon: PiggyBankIcon,
    color: "hsl(150, 60%, 45%)",
    isLiability: false,
  },
  cash: {
    label: "Cash",
    icon: BanknoteIcon,
    color: "hsl(100, 50%, 50%)",
    isLiability: false,
  },
  credit_card: {
    label: "Credit Cards",
    icon: CreditCardIcon,
    color: "hsl(350, 70%, 50%)",
    isLiability: true,
  },
  investment: {
    label: "Investments",
    icon: BriefcaseBusinessIcon,
    color: "hsl(260, 60%, 55%)",
    isLiability: false,
  },
  loan: {
    label: "Loans",
    icon: HandCoinsIcon,
    color: "hsl(30, 70%, 50%)",
    isLiability: true,
  },
  mortgage: {
    label: "Mortgage",
    icon: LandmarkIcon,
    color: "hsl(20, 60%, 50%)",
    isLiability: true,
  },
  asset: {
    label: "Assets",
    icon: CircleDollarSignIcon,
    color: "hsl(180, 50%, 50%)",
    isLiability: false,
  },
  other: {
    label: "Other",
    icon: CircleDollarSignIcon,
    color: "hsl(0, 0%, 50%)",
    isLiability: false,
  },
};

export function getAccountGroupMetadata(
  group: AccountGroup
): AccountGroupMetadata {
  return ACCOUNT_GROUP_METADATA[group];
}
