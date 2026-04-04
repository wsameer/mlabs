import { TRANSACTIONS_ROUTE } from "@/constants";
import { RequiresProfile } from "@/components/RouteGuards";
import { TransactionsPage } from "@/features/transactions";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(TRANSACTIONS_ROUTE)({
  component: TransactionsRoute,
});

function TransactionsRoute() {
  return (
    <RequiresProfile>
      <TransactionsPage />
    </RequiresProfile>
  );
}
