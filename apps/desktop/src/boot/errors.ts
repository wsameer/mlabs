export type StartupErrorCode =
  | "PORT_3001_IN_USE"
  | "DB_PATH_NOT_WRITABLE"
  | "API_START_FAILED";

export const STARTUP_ERROR_MESSAGES: Record<StartupErrorCode, string> = {
  PORT_3001_IN_USE:
    "Port 3001 is already in use. Quit whatever is using it, then relaunch mLabs.",
  DB_PATH_NOT_WRITABLE:
    "mLabs could not write to its database file. Check that ~/Library/Application Support/mLabs is writable.",
  API_START_FAILED:
    "mLabs failed to start its local server. Try relaunching; if the problem persists, check the logs.",
};

export function mapStartupError(err: unknown): StartupErrorCode {
  const message = typeof err === "string" ? err : String((err as Error)?.message ?? err ?? "");
  const lower = message.toLowerCase();
  if (lower.includes("eaddrinuse") || lower.includes("address already in use")) {
    return "PORT_3001_IN_USE";
  }
  if (lower.includes("eacces") || lower.includes("permission denied")) {
    return "DB_PATH_NOT_WRITABLE";
  }
  return "API_START_FAILED";
}
