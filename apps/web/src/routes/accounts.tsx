import { createFileRoute } from "@tanstack/react-router";
import { ACCOUNTS_ROUTE } from "@/constants";
import { RequiresProfile } from "@/components/RouteGuards";
import { AccountsPage } from "@/features/accounts";

export const Route = createFileRoute(ACCOUNTS_ROUTE)({
  component: AccountsRoute,
});

function AccountsRoute() {
  return (
    <RequiresProfile>
      <AccountsPage />
    </RequiresProfile>
  );
}
