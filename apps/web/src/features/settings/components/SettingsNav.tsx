import { ChevronRightIcon } from "lucide-react";

import { cn } from "@workspace/ui/lib/utils";

import { SETTINGS_SECTIONS, type SettingsSectionId } from "../constants";

type SettingsNavProps = {
  activeSection: SettingsSectionId | undefined;
  onSelect: (id: SettingsSectionId) => void;
  variant?: "sidebar" | "list";
};

export function SettingsNav({
  activeSection,
  onSelect,
  variant = "list",
}: SettingsNavProps) {
  const showChevron = variant === "list";

  return (
    <nav className="flex flex-col gap-0.5">
      {SETTINGS_SECTIONS.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
              "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              "focus-visible:ring-ring/30 outline-none focus-visible:ring-2",
              isActive && "bg-muted text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="flex-1 truncate font-medium">{section.label}</span>
            {showChevron && (
              <ChevronRightIcon
                className="text-muted-foreground/60 size-4 shrink-0"
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
