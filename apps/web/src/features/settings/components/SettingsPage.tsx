import { useLayoutConfig } from "@/features/layout";
import { useAppStore } from "@/stores";
import { Card, CardContent } from "@workspace/ui/components/card";

import { useProfileSettings } from "../api/use-profile-settings";
import { useProfileSettingsAutosave } from "../hooks/use-profile-settings-autosave";
import { SettingsPreferencesSection } from "./SettingsPreferencesSection";
import { SettingsProfileSummary } from "./SettingsProfileSummary";
import { SettingsReadonlySection } from "./SettingsReadonlySection";

export function SettingsPage() {
  useLayoutConfig({
    pageTitle: "Settings",
  });

  const appProfile = useAppStore((state) => state.appProfile);
  const profileId = appProfile?.id ?? "";
  const profileQuery = useProfileSettings(profileId);
  const activeProfile = profileQuery.data ?? appProfile;
  const settings = useProfileSettingsAutosave(activeProfile);

  if (!activeProfile || !settings.draft) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Loading your workspace settings...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-8">
      <SettingsProfileSummary
        profile={activeProfile}
        isRefreshing={profileQuery.isFetching}
        isSaving={settings.isBusy}
        isNotesDebouncing={settings.isNotesDebouncing}
      />

      {profileQuery.isError ? (
        <Card className="border-amber-300/70 bg-amber-50/70 dark:bg-amber-950/20">
          <CardContent className="p-4 text-sm text-amber-900 dark:text-amber-100">
            We could not refresh settings right now. You can still edit the last
            loaded values and try again.
          </CardContent>
        </Card>
      ) : null}

      <SettingsReadonlySection profile={activeProfile} />

      <SettingsPreferencesSection
        draft={settings.draft}
        isBusy={settings.isBusy}
        isNotesDebouncing={settings.isNotesDebouncing}
        isNotesSaving={settings.isNotesSaving}
        onIconChange={(value) => settings.updateImmediateField("icon", value)}
        onTypeChange={(value) => settings.updateImmediateField("type", value)}
        onCurrencyChange={(value) =>
          settings.updateImmediateField("currency", value)
        }
        onWeekStartChange={(value) =>
          settings.updateImmediateField("weekStart", value)
        }
        onDateFormatChange={(value) =>
          settings.updateImmediateField("dateFormat", value)
        }
        onNotesChange={settings.updateNotesDraft}
        onNotesSave={settings.saveNotes}
      />
    </div>
  );
}
