import { existsSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

export function loadEnvFiles() {
  const nodeEnv = process.env.NODE_ENV || "development";
  const cwd = process.cwd();

  // Defines env files in reverse priority order (last one wins)
  const envFiles = [
    ".env", // Base defaults (commited)
    `.env.${nodeEnv}`, // Environment-specific (committed)
    `.env.${nodeEnv}.local`, // Local environment overrides (gitignored)
    ".env.local", // Local overrides for all envrionments (gitignored)
  ];

  // Also check root directory (for monorepo support)
  const rootDir = resolve(cwd, "../..");
  const rootEnvFiles = envFiles.map((file) => resolve(rootDir, file));

  // Load from app directory first, then root (app takes precendence)
  const allEnvFiles = [
    ...rootEnvFiles.map((file) => ({ file, location: "root" })),
    ...envFiles
      .map((file) => resolve(cwd, file))
      .map((file) => ({ file, location: "app" })),
  ];

  const loadedFiles: string[] = [];

  for (const { file, location } of allEnvFiles) {
    if (existsSync(file)) {
      const result = config({ path: file, override: true });
      if (!result.error) {
        loadedFiles.push(`${location}:${file.split("/").pop()}`);
      }
    }
  }

  if (nodeEnv === "development" && loadedFiles.length > 0) {
    console.log(`Loaded environment files: ${loadedFiles.join(", ")}`);
  }

  return {
    loaded: loadedFiles.length > 0,
    files: loadedFiles,
  };
}
