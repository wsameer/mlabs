import type { Profile } from "@workspace/types";
import type { UseQueryResult } from "@tanstack/react-query";
import type { useProfileSettingsAutosave } from "../../hooks/use-profile-settings-autosave";

export type SettingsSectionProps = {
  profile: Profile;
  profileQuery: UseQueryResult<Profile>;
  settings: ReturnType<typeof useProfileSettingsAutosave>;
};
