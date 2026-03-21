import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

// Database connection singleton
let db: ReturnType<typeof drizzle> | null = null;

export function getDatabase(connectionString: string) {
  if (!db) {
    const queryClient = postgres(connectionString);
    db = drizzle(queryClient, { schema });
  }
  return db;
}

// Export schema and types
export * from "./schema.js";
export { sql, eq, and, or, desc, asc, count, sum, isNull } from "drizzle-orm";
