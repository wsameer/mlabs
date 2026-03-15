import { createFileRoute } from "@tanstack/react-router";
import { TRANSACTIONS_ROUTE } from "@/constants";
import { useLayoutConfig } from "@/features/layout";

export const Route = createFileRoute(TRANSACTIONS_ROUTE)({
  component: RouteComponent,
});

function RouteComponent() {
  useLayoutConfig({
    pageTitle: "Transactions",
  });

  return (
    <>
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="aspect-video h-12 w-full rounded-lg bg-muted/50"
        />
      ))}
    </>
  );
}
