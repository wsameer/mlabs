import type { LucideIcon } from "lucide-react";
import {
  BellIcon,
  DatabaseBackupIcon,
  ImportIcon,
  SlidersHorizontalIcon,
  TagsIcon,
  TriangleAlertIcon,
  UserIcon,
  WalletCardsIcon,
} from "lucide-react";
import { z } from "zod/v4";

export type SettingsSectionId =
  | "profile"
  | "preferences"
  | "notifications"
  | "categories"
  | "accounts"
  | "import"
  | "backup"
  | "danger";

export const SETTINGS_SECTION_IDS: SettingsSectionId[] = [
  "profile",
  "preferences",
  "notifications",
  "categories",
  "accounts",
  "import",
  "backup",
  "danger",
];

export const SettingsSearchSchema = z.object({
  section: z
    .enum(SETTINGS_SECTION_IDS as [SettingsSectionId, ...SettingsSectionId[]])
    .optional(),
});

export type SettingsSection = {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "profile",
    label: "Profile",
    description: "Workspace name, icon and notes",
    icon: UserIcon,
  },
  {
    id: "preferences",
    label: "Preferences",
    description: "Currency, date format and week start",
    icon: SlidersHorizontalIcon,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Alerts, reminders and digests",
    icon: BellIcon,
  },
  {
    id: "categories",
    label: "Categories",
    description: "Income and expense categories",
    icon: TagsIcon,
  },
  {
    id: "accounts",
    label: "Accounts",
    description: "Bank accounts and credit cards",
    icon: WalletCardsIcon,
  },
  {
    id: "import",
    label: "Import",
    description: "Import transactions from CSV",
    icon: ImportIcon,
  },
  {
    id: "backup",
    label: "Backup",
    description: "Export data and restore backups",
    icon: DatabaseBackupIcon,
  },
  {
    id: "danger",
    label: "Danger zone",
    description: "Reset or delete your workspace",
    icon: TriangleAlertIcon,
  },
];
