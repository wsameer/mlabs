import { useEffect } from "react";
import { AlertCircleIcon } from "lucide-react";

import { useLayoutConfig } from "@/features/layout";
import { useAppStore } from "@/stores";

import { Spinner } from "@workspace/ui/components/spinner";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";

import { AddAccount } from "@/features/add-accounts/AddAccount";
import { NetWorthChart } from "@/features/net-worth-chart";

import { useAccounts } from "./api/use-accounts";
import { calculateAccountTotals } from "./lib/account-calculations";
import { formatCurrency } from "./lib/format-utils";

import { EmptyAccounts } from "./components/EmptyAccounts";
import { AccountsView } from "./components/AccountsView";
import { AccountKpis } from "./components/AccountKpis";
import { AccountsRail } from "./components/AccountsRail";

export function AccountsPage() {
  const { data: accounts, isPending, isError } = useAccounts();
  const setHasAccount = useAppStore((state) => state.setHasAccount);
  const hasAccounts = (accounts?.length ?? 0) > 0;

  const currency = accounts?.[0]?.currency ?? "CAD";

  useLayoutConfig({
    pageTitle: "Accounts",
    actions: <AddAccount size="sm" />,
  });

  useEffect(() => {
    if (accounts) {
      setHasAccount(accounts.length > 0);
    }
  }, [accounts, setHasAccount]);

  if (isPending) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto my-auto w-full max-w-2xl">
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Could not load accounts</AlertTitle>
          <AlertDescription>
            There was a problem fetching accounts. Please try again in a moment.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!hasAccounts) {
    return (
      <div className="mx-auto my-auto w-full max-w-2xl">
        <EmptyAccounts />
      </div>
    );
  }

  const { netWorth } = calculateAccountTotals(accounts);

  return (
    <div className="flex w-full gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <header>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Net worth
          </p>
          <p className="mt-1 text-2xl text-foreground tabular-nums md:text-3xl">
            {formatCurrency(netWorth, currency)}
          </p>
        </header>

        <div className="grid items-stretch gap-4 md:grid-cols-12">
          <div className="flex flex-col md:col-span-7">
            <NetWorthChart />
          </div>
          <div className="flex flex-col md:col-span-5">
            <AccountKpis accounts={accounts} currency={currency} />
          </div>
        </div>

        <section>
          <h2 className="mb-2 text-sm font-medium text-foreground">Accounts</h2>
          <AccountsView accounts={accounts} />
        </section>
      </div>

      <aside className="w-72">
        <AccountsRail accounts={accounts} currency={currency} />
      </aside>
    </div>
  );
}
