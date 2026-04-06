import { useEffect, useMemo } from "react";
import { AlertCircleIcon } from "lucide-react";
import { useLayoutConfig } from "@/features/layout";
import { useAccounts } from "../api/use-accounts";
import { EmptyAccounts } from "./EmptyAccounts";
import { AccountCategoriesSidebar } from "./AccountCategoriesSidebar";
import { useAppStore } from "@/stores";
import { useIsMobile } from "@/hooks/use-mobile";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

export function AccountsPage() {
  const { data: accounts, isPending, isError } = useAccounts();
  const setHasAccount = useAppStore((state) => state.setHasAccount);
  const isMobile = useIsMobile();
  const hasAccounts = (accounts?.length ?? 0) > 0;

  const leftSidebarContent = useMemo(() => {
    if (isMobile || isPending || isError || hasAccounts) {
      return null;
    }

    return <AccountCategoriesSidebar />;
  }, [hasAccounts, isError, isMobile, isPending]);

  useLayoutConfig({
    pageTitle: "Accounts",
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
    <div className="mx-auto my-auto w-full max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>
            Account list states are coming next. For now, the empty flow is in
            place when there are no accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Once seeded data is available, we can replace this placeholder with
            the populated accounts experience.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
