import { ACCOUNTS_ROUTE } from "@/constants";
import { AccountsPage } from "@/features/accounts";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(ACCOUNTS_ROUTE)({
  component: AccountsPage,
});
