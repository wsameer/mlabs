import { TRANSACTIONS_ROUTE } from "@/constants";
import { RequiresProfile } from "@/components/RouteGuards";
import { TransactionsPage } from "@/features/transactions";
import { TransactionsSearchSchema } from "@/features/transactions/filters/filter-types";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(TRANSACTIONS_ROUTE)({
  component: TransactionsRoute,
  validateSearch: TransactionsSearchSchema,
});

function TransactionsRoute() {
  return (
    <RequiresProfile>
      <TransactionsPage />
    </RequiresProfile>
  );
}
