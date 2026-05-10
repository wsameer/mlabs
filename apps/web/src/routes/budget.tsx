import { createFileRoute } from "@tanstack/react-router";

import { RequiresProfile } from "@/components/RouteGuards";
import { BUDGET_ROUTE } from "@/constants";
import { BudgetPage } from "@/features/budget";

export const Route = createFileRoute(BUDGET_ROUTE)({
  component: BudgetRoute,
});

function BudgetRoute() {
  return (
    <RequiresProfile>
      <BudgetPage />
    </RequiresProfile>
  );
}
