import { Card, CardContent } from "@workspace/ui/components/card";
import type { Profile } from "@workspace/types";

import { getInitials, WORKSPACE_TYPE_LABELS } from "./settings-shared";

type SettingsProfileSummaryProps = {
  profile: Profile;
  isRefreshing: boolean;
  isSaving: boolean;
  isNotesDebouncing: boolean;
};

export function SettingsProfileSummary({
  profile,
  isRefreshing,
  isSaving,
  isNotesDebouncing,
}: SettingsProfileSummaryProps) {
  const statusLabel = isSaving
    ? "Saving..."
    : isNotesDebouncing
      ? "Waiting to save..."
      : isRefreshing
        ? "Syncing..."
        : "Up to date";

  return (
    <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-background via-background to-muted/40">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl shadow-sm">
          {profile.icon || getInitials(profile.name)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{profile.name}</p>
          <p className="text-sm text-muted-foreground">
            {WORKSPACE_TYPE_LABELS[profile.type]} workspace
          </p>
        </div>

        <div className="text-right text-xs text-muted-foreground">
          <p>{statusLabel}</p>
        </div>
      </CardContent>
    </Card>
  );
}
