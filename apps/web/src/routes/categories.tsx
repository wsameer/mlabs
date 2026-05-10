import { createFileRoute } from "@tanstack/react-router";

import { RequiresProfile } from "@/components/RouteGuards";
import { CATEGORIES_ROUTE } from "@/constants";
import { CategoriesPage } from "@/features/categories";

export const Route = createFileRoute(CATEGORIES_ROUTE)({
  component: CategoriesRoute,
});

function CategoriesRoute() {
  return (
    <RequiresProfile>
      <CategoriesPage />
    </RequiresProfile>
  );
}
