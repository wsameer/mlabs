import { mkdirSync } from "fs";
import { dirname, isAbsolute, resolve } from "path";
import { fileURLToPath } from "url";

const dbPackageSrcDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(dbPackageSrcDir, "../../..");

export function resolveDatabasePath(databaseUrl: string): string {
  const normalized = databaseUrl.startsWith("file:")
    ? databaseUrl.slice("file:".length)
    : databaseUrl;

  return isAbsolute(normalized)
    ? normalized
    : resolve(workspaceRoot, normalized);
}

export function ensureDatabaseDirectory(databasePath: string): void {
  mkdirSync(dirname(databasePath), { recursive: true });
}
