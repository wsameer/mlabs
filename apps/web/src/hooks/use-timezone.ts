import { useAppStore } from "@/stores/app-store";
import { DEFAULT_TIMEZONE } from "@/lib/timezone";

export const useTimezone = (): string =>
  useAppStore((state) => state.appProfile?.timezone ?? DEFAULT_TIMEZONE);
