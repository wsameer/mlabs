import { useEffect } from "react";
import { AlertCircleIcon } from "lucide-react";
import { useLayoutConfig } from "@/features/layout";
import { useAccounts } from "../api/use-accounts";
import { EmptyAccounts } from "./EmptyAccounts";
import { AccountsView } from "./AccountsView";
import { AssetsLiabilitiesDisplay } from "./AssetsLiabilitiesDisplay";
import { useAppStore } from "@/stores";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { AddAccount } from "@/features/add-accounts/AddAccount";
import { calculateAccountTotals } from "../lib/account-calculations";
import { formatCurrency } from "../lib/format-utils";
import { NetWorthChart } from "@/features/net-worth-chart";

export function AccountsPage() {
  const { data: accounts, isPending, isError } = useAccounts();
  const setHasAccount = useAppStore((state) => state.setHasAccount);
  const hasAccounts = (accounts?.length ?? 0) > 0;

  useLayoutConfig({
    pageTitle: "Accounts",
    leftSidebarContent: null,
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

  // Calculate totals
  const currency = accounts[0]?.currency ?? "CAD";
  const { netWorth } = calculateAccountTotals(accounts);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-row items-start justify-between">
          <div>
            <small className="text-xs leading-none font-medium text-muted-foreground uppercase md:text-sm">
              Net worth
            </small>
            <h3 className="scroll-m-20 text-2xl tracking-tight tabular-nums md:text-3xl">
              {formatCurrency(netWorth, currency)}
            </h3>
          </div>
        </div>
        <div className="flex flex-col items-start">
          <AssetsLiabilitiesDisplay accounts={accounts} currency={currency} />
        </div>
      </div>

      <NetWorthChart />

      <div className="flex flex-row flex-wrap gap-4 md:flex-wrap-reverse">
        <div className="min-w-0 grow md:grow-3 md:basis-0">
          <AccountsView accounts={accounts} />
        </div>
        <Card className="hidden min-w-0 md:flex md:grow-2 md:basis-0">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Active milestones for 2024</CardDescription>
            <CardAction>
              <Tabs defaultValue="totals">
                <TabsList>
                  <TabsTrigger value="totals">Totals</TabsTrigger>
                  <TabsTrigger value="percent">Percent</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="h-2/4">Dummy data</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
