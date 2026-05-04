import { getDatabase } from "@workspace/db";
import { env } from "./env.js";

let dbInstance: ReturnType<typeof getDatabase> | null = null;

export function getDb() {
  if (!dbInstance) {
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not defined. Please set it in your environment variables.");
    }
    dbInstance = getDatabase(env.DATABASE_URL);
  }
  return dbInstance;
}

// Export singleton db instance for convenience
export const db = getDb();

export { sql, eq, and, or, desc, asc, count, sum } from "@workspace/db";
