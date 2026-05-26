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

import { useAccounts } from "./api/use-accounts";

import { EmptyAccounts } from "./components/EmptyAccounts";
import { AccountsView } from "./components/AccountsView";
import { AccountKpis } from "./components/AccountKpis";
import { AccountsRail } from "./components/AccountsRail";
import { ScrollArea } from "@workspace/ui/components/scroll-area";

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

  return (
    // <div className="grid h-[calc(100svh-4.5rem)] w-full min-w-0 grid-cols-3 gap-3 overflow-hidden p-0.5">
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 flex flex-col p-1">
        <AccountKpis accounts={accounts} currency={currency} />
        <section className="mt-4 min-h-0">
          <h2 className="mb-2 text-sm font-medium text-foreground">Accounts</h2>
          <AccountsView accounts={accounts} />
        </section>
      </div>
      <div>
        <AccountsRail accounts={accounts} currency={currency} />
      </div>
    </div>
  );
}
