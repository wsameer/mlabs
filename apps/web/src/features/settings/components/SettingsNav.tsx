import { ChevronRightIcon } from "lucide-react";

import { cn } from "@workspace/ui/lib/utils";

import { SETTINGS_SECTIONS, type SettingsSectionId } from "../constants";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";

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
    <nav>
      <Card className="flex flex-col gap-1 p-2">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <Button
              size="lg"
              variant="ghost"
              key={section.id}
              onClick={() => onSelect(section.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn("text-left text-xs transition-colors", {
                "bg-muted text-foreground": isActive,
              })}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="flex-1 truncate pl-1 font-normal">
                {section.label}
              </span>
              {showChevron && (
                <ChevronRightIcon
                  className="size-4 shrink-0 text-muted-foreground/60"
                  aria-hidden
                />
              )}
            </Button>
          );
        })}
      </Card>
    </nav>
  );
}
