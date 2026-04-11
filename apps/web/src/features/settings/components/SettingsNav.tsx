import { ChevronRightIcon } from "lucide-react";

import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item";
import { cn } from "@workspace/ui/lib/utils";
import { Separator } from "@workspace/ui/components/separator";

import {
  SETTINGS_SECTIONS,
  SETTINGS_GROUPS,
  type SettingsSectionId,
} from "../constants";

type SettingsNavProps = {
  activeSection: SettingsSectionId | null;
  onSelect: (id: SettingsSectionId) => void;
  variant?: "sidebar" | "list";
};

export function SettingsNav({
  activeSection,
  onSelect,
  variant = "list",
}: SettingsNavProps) {
  // Desktop sidebar — flat list, no groups
  if (variant === "sidebar") {
    return (
      <div className="mt-2 flex flex-col gap-1">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <Item
              key={section.id}
              size="sm"
              render={
                <button
                  type="button"
                  className={cn(
                    "w-full p-1.5! text-left hover:bg-primary-foreground",
                    {
                      "bg-sidebar-primary hover:bg-sidebar-primary/90":
                        isActive,
                    }
                  )}
                  onClick={() => onSelect(section.id)}
                />
              }
            >
              <ItemMedia>
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md",
                    section.iconBg
                  )}
                >
                  <Icon className="size-3.5" />
                </div>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{section.label}</ItemTitle>
              </ItemContent>
            </Item>
          );
        })}
      </div>
    );
  }

  // Mobile — iOS grouped table view
  return (
    <div className="flex flex-col gap-6">
      {SETTINGS_GROUPS.map((group) => {
        const items = SETTINGS_SECTIONS.filter((s) => s.group === group.key);
        if (items.length === 0) return null;

        return (
          <div key={group.key} className="flex flex-col gap-1">
            <div className="overflow-hidden rounded-xl bg-card">
              {items.map((section, index) => {
                const Icon = section.icon;
                const isLast = index === items.length - 1;

                return (
                  <div key={section.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 py-2.5 text-left active:bg-muted/60"
                      onClick={() => onSelect(section.id)}
                    >
                      <div
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-lg",
                          section.iconBg
                        )}
                      >
                        <Icon className="size-4 text-white" />
                      </div>
                      <span className="flex-1 text-sm font-normal">
                        {section.label}
                      </span>
                      <ChevronRightIcon className="size-4 text-muted-foreground/60" />
                    </button>
                    {!isLast && <Separator className="ml-4 pr-8" />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
