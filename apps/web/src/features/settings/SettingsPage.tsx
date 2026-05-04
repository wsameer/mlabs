import { useCallback, useMemo } from "react";
import { ChevronRightIcon } from "lucide-react";
import { Route } from "@/routes/settings";

import { Spinner } from "@workspace/ui/components/spinner";

import { useLayoutConfig } from "@/features/layout";
import { useAppStore } from "@/stores";
import { useIsMobile } from "@/hooks/use-mobile";

import { useProfileSettings } from "./api/use-profile-settings";
import { useProfileSettingsAutosave } from "./hooks/use-profile-settings-autosave";
import { SettingsNav } from "./components/SettingsNav";
import { SETTINGS_SECTIONS, type SettingsSectionId } from "./constants";
import {
  getInitials,
  WORKSPACE_TYPE_LABELS,
} from "./components/settings-shared";

import { ProfileSection } from "./features/profile";
import { PreferencesSection } from "./features/preferences";
import { NotificationsSection } from "./features/notifications";
import { CategoriesSection } from "./features/category-management";
import { AccountsSection } from "./features/accounts";
import { BackupSection } from "./features/backup";
import { ImportSection } from "./features/import-transactions";

export function SettingsPage() {
  const isMobile = useIsMobile();
  const search = Route.useSearch() as { section?: SettingsSectionId };
  const activeSection = search.section;
  const navigate = Route.useNavigate();

  const appProfile = useAppStore((state) => state.appProfile);
  const profileId = appProfile?.id ?? "";
  const profileQuery = useProfileSettings(profileId);
  const activeProfile = profileQuery.data ?? appProfile;
  const settings = useProfileSettingsAutosave(activeProfile);

  const handleSelectSection = useCallback(
    (id: SettingsSectionId) => {
      navigate({ search: { section: id } });
    },
    [navigate]
  );

  const handleBack = useCallback(() => {
    navigate({ search: {} });
  }, [navigate]);

  const activeSectionLabel = activeSection
    ? SETTINGS_SECTIONS.find((s) => s.id === activeSection)?.label
    : null;

  // On desktop, default to "profile" when nothing selected
  const resolvedSection = activeSection ?? (isMobile ? undefined : "profile");

  // Desktop: show nav in left sidebar
  const sidebarContent = useMemo(() => {
    if (isMobile) return null;
    return (
      <SettingsNav
        activeSection={resolvedSection}
        onSelect={handleSelectSection}
        variant="sidebar"
      />
    );
  }, [isMobile, resolvedSection, handleSelectSection]);

  useLayoutConfig({
    pageTitle: isMobile && activeSectionLabel ? activeSectionLabel : "Settings",
    onMobileBack: isMobile && activeSection ? handleBack : null,
    leftSidebarContent: sidebarContent,
  });

  // Loading state
  if (!activeProfile || !settings.draft) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    );
  }

  const sectionProps = {
    profile: activeProfile,
    profileQuery,
    settings,
  };

  // Mobile: show iOS-style settings list
  if (isMobile && resolvedSection === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <button
          type="button"
          className="flex w-full items-center gap-3.5 rounded-xl bg-card py-3 text-left active:bg-muted/60"
          onClick={() => handleSelectSection("profile")}
        >
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-muted to-muted/60 text-xl font-semibold">
            {activeProfile.icon || getInitials(activeProfile.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold">
              {activeProfile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {WORKSPACE_TYPE_LABELS[activeProfile.type]} workspace
            </p>
          </div>
          <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/60" />
        </button>

        <SettingsNav
          activeSection={undefined}
          onSelect={handleSelectSection}
          variant="list"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-8">
      {resolvedSection === "profile" && <ProfileSection {...sectionProps} />}
      {resolvedSection === "preferences" && (
        <PreferencesSection {...sectionProps} />
      )}
      {resolvedSection === "notifications" && <NotificationsSection />}
      {resolvedSection === "categories" && <CategoriesSection />}
      {resolvedSection === "accounts" && <AccountsSection />}
      {resolvedSection === "import" && <ImportSection />}
      {resolvedSection === "backup" && <BackupSection />}
    </div>
  );
}
