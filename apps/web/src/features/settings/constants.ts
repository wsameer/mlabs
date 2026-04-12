import type { LucideIcon } from "lucide-react";
import {
  UserIcon,
  SlidersHorizontalIcon,
  BellIcon,
  TagsIcon,
  WalletCardsIcon,
  DatabaseBackupIcon,
  ImportIcon,
} from "lucide-react";
import { z } from "zod/v4";

export type SettingsSectionId =
  | "profile"
  | "preferences"
  | "notifications"
  | "categories"
  | "accounts"
  | "import"
  | "backup";

export const SETTINGS_SECTION_IDS: SettingsSectionId[] = [
  "profile",
  "preferences",
  "notifications",
  "categories",
  "accounts",
  "import",
  "backup",
];

export const SettingsSearchSchema = z.object({
  section: z.enum(SETTINGS_SECTION_IDS as [SettingsSectionId, ...SettingsSectionId[]]).optional(),
});

export type SettingsSection = {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  /** Group key for visual grouping in the mobile list */
  group: "general" | "data";
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "profile",
    label: "Profile",
    description: "Workspace name, icon and notes",
    icon: UserIcon,
    iconBg: "bg-gray-200",
    group: "general",
  },
  {
    id: "preferences",
    label: "Preferences",
    description: "Currency, date format and week start",
    icon: SlidersHorizontalIcon,
    iconBg: "bg-gray-200",
    group: "general",
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Alerts, reminders and digests",
    icon: BellIcon,
    iconBg: "bg-gray-200",
    group: "general",
  },
  {
    id: "categories",
    label: "Categories",
    description: "Income and expense categories",
    icon: TagsIcon,
    iconBg: "bg-gray-200",
    group: "data",
  },
  {
    id: "accounts",
    label: "Accounts",
    description: "Bank accounts and credit cards",
    icon: WalletCardsIcon,
    iconBg: "bg-gray-200",
    group: "data",
  },
  {
    id: "import",
    label: "Import",
    description: "Import transactions from CSV",
    icon: ImportIcon,
    iconBg: "bg-gray-200",
    group: "data",
  },
  {
    id: "backup",
    label: "Backup",
    description: "Export data and restore backups",
    icon: DatabaseBackupIcon,
    iconBg: "bg-gray-200",
    group: "data",
  },
];

export const SETTINGS_GROUPS = [
  { key: "general" as const, label: null },
  { key: "data" as const, label: null },
];
