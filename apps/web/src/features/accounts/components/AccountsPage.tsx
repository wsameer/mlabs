import { useEffect } from "react";
import { AlertCircleIcon } from "lucide-react";
import { useLayoutConfig } from "@/features/layout";
import { useAccounts } from "../api/use-accounts";
import { EmptyAccounts } from "./EmptyAccounts";
import { AccountsView } from "./AccountsView";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
} from "@workspace/ui/components/item";
import { Progress } from "@workspace/ui/components/progress";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";

export function AccountsPage() {
  const { data: accounts, isPending, isError, refetch } = useAccounts();
  const setHasAccount = useAppStore((state) => state.setHasAccount);
  const hasAccounts = (accounts?.length ?? 0) > 0;

  useLayoutConfig({
    pageTitle: "Accounts",
    leftSidebarContent: null,
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
    <div className="flex flex-row flex-wrap gap-4 md:flex-wrap-reverse">
      <div className="grow">
        <AccountsView
          accounts={accounts}
          onRefresh={() => refetch()}
          isRefreshing={isPending}
        />
      </div>
      <Card className="grow">
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
  );
}
