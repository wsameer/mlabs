import { CloudOffIcon, RefreshCcwIcon } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";

import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@workspace/ui/components/empty";
import { MAINTENANCE_ROUTE } from "@/constants";

export const Route = createFileRoute(MAINTENANCE_ROUTE)({
  component: MaintenancePage,
});

export function MaintenancePage() {
  return (
    <div className="w-full max-w-sm">
      <Empty>
        <EmptyHeader>
          <CloudOffIcon className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <EmptyTitle className="scroll-m-20 text-2xl font-semibold tracking-tight">
            Service Unavailable
          </EmptyTitle>
          <EmptyDescription>
            We&apos;re experiencing temporary issues with our services. The application is currently unavailable. Please try again in a few minutes.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            <RefreshCcwIcon />
            Refresh
          </Button>
          <EmptyDescription>
            Need help? <a href="#">Contact support</a>
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    </div>
  );
}
