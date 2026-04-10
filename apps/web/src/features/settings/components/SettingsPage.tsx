import { useCallback, useMemo, useState } from "react";
import { ChevronRightIcon } from "lucide-react";

import { Spinner } from "@workspace/ui/components/spinner";

import { useLayoutConfig } from "@/features/layout";
import { useAppStore } from "@/stores";
import { useIsMobile } from "@/hooks/use-mobile";

import { useProfileSettings } from "../api/use-profile-settings";
import { useProfileSettingsAutosave } from "../hooks/use-profile-settings-autosave";
import { SettingsNav } from "./SettingsNav";
import { SETTINGS_SECTIONS, type SettingsSectionId } from "../constants";
import { getInitials, WORKSPACE_TYPE_LABELS } from "./settings-shared";

import { ProfileSection } from "./sections/ProfileSection";
import { PreferencesSection } from "./sections/PreferencesSection";
import { NotificationsSection } from "./sections/NotificationsSection";
import { CategoriesSection } from "./sections/CategoriesSection";
import { AccountsSection } from "./sections/AccountsSection";
import { BackupSection } from "./sections/BackupSection";

export function SettingsPage() {
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState<SettingsSectionId | null>(
    null
  );

  const appProfile = useAppStore((state) => state.appProfile);
  const profileId = appProfile?.id ?? "";
  const profileQuery = useProfileSettings(profileId);
  const activeProfile = profileQuery.data ?? appProfile;
  const settings = useProfileSettingsAutosave(activeProfile);

  const handleSelectSection = useCallback((id: SettingsSectionId) => {
    setActiveSection(id);
  }, []);

  const handleBack = useCallback(() => {
    setActiveSection(null);
  }, []);

  const activeSectionLabel = activeSection
    ? SETTINGS_SECTIONS.find((s) => s.id === activeSection)?.label
    : null;

  // Desktop: show nav in left sidebar
  const sidebarContent = useMemo(() => {
    if (isMobile) return null;
    return (
      <SettingsNav
        activeSection={activeSection}
        onSelect={handleSelectSection}
        variant="sidebar"
      />
    );
  }, [isMobile, activeSection, handleSelectSection]);

  // On desktop, default to "profile" when nothing selected
  const resolvedSection = activeSection ?? (isMobile ? null : "profile");

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
  if (isMobile && resolvedSection === null) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        {/* iOS-style profile card */}
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
          activeSection={null}
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
      {resolvedSection === "backup" && <BackupSection />}
    </div>
  );
}
