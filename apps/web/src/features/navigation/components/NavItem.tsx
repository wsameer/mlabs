import React from "react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

type Props = {
  icon: React.ReactElement;
  isActive: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export const NavItem = ({
  icon,
  isActive,
  label,
  onClick,
  disabled,
}: Props) => {
  return (
    <Button
      className={cn(
        "relative flex h-10.5 w-10.5 items-center justify-center rounded-full text-background/70 hover:bg-background/15 hover:text-background active:translate-y-0 dark:text-foreground/70 dark:hover:text-foreground",
        {
          "text-foreground hover:text-foreground dark:text-card dark:hover:text-card":
            isActive,
          "cursor-not-allowed opacity-40": disabled,
        }
      )}
      variant="link"
      onClick={onClick}
      size="icon"
      disabled={disabled}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-opacity",
          "bg-background dark:bg-foreground",
          isActive ? "opacity-100" : "opacity-0"
        )}
      />
      <span className="relative">{icon}</span>
      <span className="sr-only">{label}</span>
    </Button>
  );
};
