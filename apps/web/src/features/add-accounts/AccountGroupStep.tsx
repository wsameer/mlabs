import type { AccountGroupType } from "@workspace/types";
import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item";
import {
  BanknoteIcon,
  ChartLineIcon,
  CircleDollarSign,
  CreditCardIcon,
  PiggyBankIcon,
  SquarePercentIcon,
  UploadIcon,
} from "lucide-react";
import React from "react";

const ACCOUNT_TYPES: {
  type: AccountGroupType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { type: "cash", label: "Cash", icon: <BanknoteIcon className="size-4" /> },
  {
    type: "investment",
    label: "Investment",
    icon: <ChartLineIcon className="size-4" />,
  },
  {
    type: "credit_card",
    label: "Credit Card",
    icon: <CreditCardIcon className="size-4" />,
  },
  {
    type: "chequing",
    label: "Chequing",
    icon: <BanknoteIcon className="size-4" />,
  },
  {
    type: "savings",
    label: "Savings",
    icon: <PiggyBankIcon className="size-4" />,
  },
  {
    type: "mortgage",
    label: "Mortgage",
    icon: <SquarePercentIcon className="size-4" />,
  },
  {
    type: "loan",
    label: "Loan",
    icon: <SquarePercentIcon className="size-4" />,
  },
  {
    type: "asset",
    label: "Asset",
    icon: <SquarePercentIcon className="size-4" />,
  },
  {
    type: "other",
    label: "Other",
    icon: <CircleDollarSign className="size-4" />,
  },
] as const;

export function AccountGroupStep({
  onSelect,
}: {
  onSelect: (type: AccountGroupType) => void;
}) {
  return (
    <div className="flex flex-col pb-6">
      {ACCOUNT_TYPES.map((account) => (
        <Item
          key={account.type}
          role="listitem"
          size="xs"
          className="rounded-none"
          render={
            <button
              onClick={() => onSelect(account.type)}
              className="px-4 hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50"
            >
              <ItemMedia variant="icon">{account.icon}</ItemMedia>
              <ItemContent>
                <ItemTitle className="font-base">{account.label}</ItemTitle>
              </ItemContent>
            </button>
          }
        />
      ))}
      <Item
        size="xs"
        className="rounded-none"
        render={
          <button disabled className="cursor-not-allowed px-4 opacity-50">
            <ItemMedia variant="icon">
              <UploadIcon className="size-4" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                Import accounts
                <p className="text-muted-foreground">(coming soon)</p>
              </ItemTitle>
            </ItemContent>
          </button>
        }
      />
    </div>
  );
}
