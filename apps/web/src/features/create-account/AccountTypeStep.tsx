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
import type { AccountType } from "./types";

const ACCOUNT_TYPES: {
  type: AccountType;
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
    type: "credit",
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
    type: "gic",
    label: "GIC",
    icon: <SquarePercentIcon className="size-4" />,
  },
  {
    type: "other",
    label: "Other",
    icon: <CircleDollarSign className="size-4" />,
  },
];

export function AccountTypeStep({
  onSelect,
}: {
  onSelect: (type: AccountType) => void;
}) {
  return (
    <div className="flex flex-col gap-1 pb-2">
      {ACCOUNT_TYPES.map((account) => (
        <Item
          key={account.type}
          role="listitem"
          size="xs"
          render={
            <button
              onClick={() => onSelect(account.type)}
              className="hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50"
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
        render={
          <a href="#">
            <ItemMedia variant="icon">
              <UploadIcon className="size-4" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                Import accounts
                <p className="text-muted-foreground">(coming soon)</p>
              </ItemTitle>
            </ItemContent>
          </a>
        }
      />
    </div>
  );
}
