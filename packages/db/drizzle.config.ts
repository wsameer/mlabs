import { defineConfig } from "drizzle-kit";
import { fileURLToPath } from "url";
import { dirname, isAbsolute, resolve } from "path";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required. Run via pnpm db:* scripts which load .env automatically."
  );
}

const configDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(configDir, "../..");

const normalizedDatabaseUrl = process.env.DATABASE_URL.startsWith("file:")
  ? process.env.DATABASE_URL.slice("file:".length)
  : process.env.DATABASE_URL;

const databasePath = isAbsolute(normalizedDatabaseUrl)
  ? normalizedDatabaseUrl
  : resolve(workspaceRoot, normalizedDatabaseUrl);

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: databasePath,
  },
  verbose: true,
  strict: true,
});
