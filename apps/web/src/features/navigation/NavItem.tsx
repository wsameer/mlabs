import React from "react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

type Props = {
  icon: React.ReactElement;
  isActive: boolean;
  label: string;
  onClick: () => void;
};

export const NavItem = ({ icon, isActive, label, onClick }: Props) => {
  return (
    <Button
      className={cn(
        "relative flex h-10.5 w-10.5 items-center justify-center rounded-full text-foreground opacity-50 hover:bg-background/40 hover:opacity-100 active:translate-y-0",
        {
          "opacity-100": isActive,
        }
      )}
      variant="link"
      onClick={onClick}
      size="icon"
    >
      <div
        className={`absolute inset-0 rounded-full bg-white transition-opacity dark:bg-zinc-900 ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
      />
      <span className={`relative ${isActive ? "text-foreground" : ""}`}>
        {icon}
      </span>
      <span className="sr-only">{label}</span>
    </Button>
  );
};
