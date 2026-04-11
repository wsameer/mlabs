import { BellIcon } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";

export function NotificationsSection() {
  return (
    <div className="flex flex-col gap-5">
      <Empty className="rounded-xl border-none py-16 md:rounded-lg md:border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BellIcon />
          </EmptyMedia>
          <EmptyTitle>Notifications</EmptyTitle>
          <EmptyDescription>
            Configure alerts, reminders and weekly digests. Coming soon.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
