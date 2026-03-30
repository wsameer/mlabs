import { TRANSACTIONS_ROUTE } from "@/constants";
import { TransactionsPage } from "@/features/transactions";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(TRANSACTIONS_ROUTE)({
  component: TransactionsPage,
});
