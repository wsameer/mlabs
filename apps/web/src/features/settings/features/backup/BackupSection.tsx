import { DatabaseBackupIcon } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";

export function BackupSection() {
  return (
    <div className="flex flex-col gap-5">
      <Empty className="rounded-xl border-none py-16 md:rounded-lg md:border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <DatabaseBackupIcon />
          </EmptyMedia>
          <EmptyTitle>Backup</EmptyTitle>
          <EmptyDescription>
            Export your data or restore from a backup. Coming soon.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
