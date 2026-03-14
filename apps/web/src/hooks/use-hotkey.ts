import { useEffect, useCallback } from "react";

type ModifierKey = "ctrl" | "meta" | "alt" | "shift";
type HotkeyConfig = {
  key: string;
  modifiers?: ModifierKey[];
  callback: () => void;
  enabled?: boolean;
};

export function useHotkey({
  key,
  modifiers = [],
  callback,
  enabled = true,
}: HotkeyConfig) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Check if the key matches
      if (event.key.toLowerCase() !== key.toLowerCase()) return;

      // Check modifiers
      const ctrlRequired = modifiers.includes("ctrl");
      const metaRequired = modifiers.includes("meta");
      const altRequired = modifiers.includes("alt");
      const shiftRequired = modifiers.includes("shift");

      // For cross-platform, treat ctrl and meta as interchangeable for common shortcuts
      const cmdOrCtrl = event.metaKey || event.ctrlKey;
      const cmdOrCtrlRequired = ctrlRequired || metaRequired;

      if (cmdOrCtrlRequired && !cmdOrCtrl) return;
      if (!cmdOrCtrlRequired && cmdOrCtrl) return;
      if (altRequired !== event.altKey) return;
      if (shiftRequired !== event.shiftKey) return;

      // Don't trigger if user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      event.preventDefault();
      callback();
    },
    [key, modifiers, callback, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);
}
