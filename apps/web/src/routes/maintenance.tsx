import { CloudOffIcon } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";

import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty";
import { MAINTENANCE_ROUTE } from "@/constants";

export const Route = createFileRoute(MAINTENANCE_ROUTE)({
  component: MaintenancePage,
});

export function MaintenancePage() {
  return (
    <Empty>
      <EmptyHeader className="pb-4">
        <CloudOffIcon className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <EmptyTitle className="scroll-m-20 text-2xl font-semibold tracking-tight">
          Service Unavailable
        </EmptyTitle>
        <EmptyDescription className="text-base">
          We&apos;re experiencing temporary issues with our services. The
          application is currently unavailable. Please try again in a few
          minutes.
        </EmptyDescription>
      </EmptyHeader>
      <div className="flex flex-col items-center gap-4">
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    </Empty>
  );
}
