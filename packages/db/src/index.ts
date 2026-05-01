import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";
import { ensureDatabaseDirectory, resolveDatabasePath } from "./path.js";

// Database connection singleton
let db: ReturnType<typeof drizzle> | null = null;
let sqliteClient: Client | null = null;

export function getDatabase(databaseUrl: string) {
  if (!db) {
    const databasePath = resolveDatabasePath(databaseUrl);
    ensureDatabaseDirectory(databasePath);
    const sqliteUrl = `file:${databasePath}`;

    sqliteClient = createClient({ url: sqliteUrl });
    void sqliteClient.execute("PRAGMA journal_mode = WAL");
    void sqliteClient.execute("PRAGMA foreign_keys = ON");

    db = drizzle(sqliteClient, { schema });
  }
  return db;
}

// Export schema and types
export * from "./schema.js";
export {
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORY_TREE,
  seedCategoriesForProfile,
} from "./default-categories.js";
export { sql, eq, and, or, desc, asc, count, sum, isNull, gte, lte } from "drizzle-orm";
