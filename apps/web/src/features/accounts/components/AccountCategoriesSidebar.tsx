import { Badge } from "@workspace/ui/components/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { Separator } from "@workspace/ui/components/separator";
import {
  BanknoteIcon,
  BriefcaseBusinessIcon,
  BuildingIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleDollarSignIcon,
  CreditCardIcon,
  HandCoinsIcon,
  LandmarkIcon,
  PiggyBankIcon,
} from "lucide-react";

const PLACEHOLDER_ACCOUNT_CATEGORIES = [
  {
    id: "checking",
    label: "Chequing",
    description: "Everyday spending and bill payments",
    icon: BuildingIcon,
    accounts: ["Main chequing", "Joint bills account"],
  },
  {
    id: "savings",
    label: "Savings",
    description: "Short-term goals and rainy day funds",
    icon: PiggyBankIcon,
    accounts: ["Emergency fund", "Vacation savings"],
  },
  {
    id: "cash",
    label: "Cash",
    description: "Wallet cash and petty cash balances",
    icon: BanknoteIcon,
    accounts: ["Wallet cash"],
  },
  {
    id: "credit-card",
    label: "Credit Cards",
    description: "Cards you pay down each month",
    icon: CreditCardIcon,
    accounts: ["Visa rewards", "Travel Mastercard"],
  },
  {
    id: "investment",
    label: "Investments",
    description: "Brokerage, retirement, and growth accounts",
    icon: BriefcaseBusinessIcon,
    accounts: ["TFSA portfolio", "Retirement account"],
  },
  {
    id: "loan",
    label: "Loans",
    description: "Personal loans and lines of credit",
    icon: HandCoinsIcon,
    accounts: ["Student loan"],
  },
  {
    id: "mortgage",
    label: "Mortgage",
    description: "Home financing and related debt",
    icon: LandmarkIcon,
    accounts: ["Primary residence mortgage"],
  },
  {
    id: "asset",
    label: "Assets",
    description: "Tracked non-cash assets",
    icon: CircleDollarSignIcon,
    accounts: ["Car value", "Home down payment fund"],
  },
  {
    id: "other",
    label: "Other",
    description: "Anything that does not fit the standard buckets",
    icon: CircleDollarSignIcon,
    accounts: ["Miscellaneous account"],
  },
] as const;

export function AccountCategoriesSidebar() {
  return (
    <div className="flex flex-col">
      {PLACEHOLDER_ACCOUNT_CATEGORIES.map((category, index) => {
        const Icon = category.icon;

        return (
          <div key={category.id}>
            <Collapsible defaultOpen={index === 0}>
              <CollapsibleTrigger className="group/account-category flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50 aria-expanded:bg-muted/40">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-muted p-2 text-muted-foreground">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-foreground">
                      {category.label}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{category.accounts.length}</Badge>
                  <ChevronDownIcon className="size-4 text-muted-foreground group-aria-expanded/account-category:hidden" />
                  <ChevronUpIcon className="hidden size-4 text-muted-foreground group-aria-expanded/account-category:inline" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden px-4 pb-3 data-open:animate-accordion-down data-closed:animate-accordion-up">
                <div className="space-y-2 rounded-lg bg-muted/30 p-3">
                  {category.accounts.map((accountName) => (
                    <div
                      key={accountName}
                      className="rounded-md bg-background px-3 py-2 text-xs text-foreground ring-1 ring-border/60"
                    >
                      {accountName}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
            {index < PLACEHOLDER_ACCOUNT_CATEGORIES.length - 1 ? (
              <Separator />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
