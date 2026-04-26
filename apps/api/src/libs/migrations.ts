import { existsSync, statSync } from "node:fs";
import { migrate } from "drizzle-orm/libsql/migrator";
import { getDb } from "./db.js";
import { logger } from "./logger.js";

export async function applyMigrationsIfEnabled(): Promise<void> {
  const folder = process.env.MIGRATIONS_FOLDER;
  if (!folder) {
    return;
  }
  if (!existsSync(folder) || !statSync(folder).isDirectory()) {
    throw new Error(
      `MIGRATIONS_FOLDER path does not exist or is not a directory: ${folder}`
    );
  }
  logger.info(`Applying migrations from ${folder}`);
  await migrate(getDb(), { migrationsFolder: folder });
  logger.info("Migrations applied");
}
