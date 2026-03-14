import { createFileRoute } from "@tanstack/react-router";
import { TRANSACTIONS_ROUTE } from "@/constants";

export const Route = createFileRoute(TRANSACTIONS_ROUTE)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="mb-16 flex flex-1 flex-col gap-4 p-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="aspect-video h-12 w-full rounded-lg bg-muted/50"
        />
      ))}
    </div>
  );
}
