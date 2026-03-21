import { sql } from "drizzle-orm";
import { getDatabase } from "./index.js";
import * as schema from "./schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

// Tables in order (respects foreign key dependencies)
const TABLES = [
  { name: "transactions", table: schema.transactions },
  { name: "budgets", table: schema.budgets },
  { name: "accounts", table: schema.accounts },
  { name: "categories", table: schema.categories },
  { name: "profiles", table: schema.profiles },
] as const;

async function getTableCounts(db: ReturnType<typeof getDatabase>) {
  const counts: Record<string, number> = {};

  for (const { name, table } of TABLES) {
    const result = await db.select({ count: sql<number>`count(*)` }).from(table);
    counts[name] = Number(result[0]?.count ?? 0);
  }

  return counts;
}

async function dryRun() {
  console.log("🔍 DRY RUN - Showing current table data\n");

  const db = getDatabase(DATABASE_URL!);
  const counts = await getTableCounts(db);

  console.log("┌─────────────────┬───────────┐");
  console.log("│ Table           │ Row Count │");
  console.log("├─────────────────┼───────────┤");

  let totalRows = 0;
  for (const [table, count] of Object.entries(counts)) {
    console.log(`│ ${table.padEnd(15)} │ ${String(count).padStart(9)} │`);
    totalRows += count;
  }

  console.log("├─────────────────┼───────────┤");
  console.log(`│ ${"TOTAL".padEnd(15)} │ ${String(totalRows).padStart(9)} │`);
  console.log("└─────────────────┴───────────┘");

  if (totalRows === 0) {
    console.log("\n✨ Database is already empty!");
  } else {
    console.log("\n⚠️  To delete all data, run:");
    console.log("   pnpm db:empty --execute");
  }

  process.exit(0);
}

async function execute() {
  console.log("🗑️  EMPTYING DATABASE\n");

  const db = getDatabase(DATABASE_URL!);

  // Show before counts
  const beforeCounts = await getTableCounts(db);
  const totalBefore = Object.values(beforeCounts).reduce((a, b) => a + b, 0);

  if (totalBefore === 0) {
    console.log("✨ Database is already empty!");
    process.exit(0);
  }

  console.log(`Found ${totalBefore} total rows across ${TABLES.length} tables\n`);

  // Use TRUNCATE CASCADE for efficiency and to handle foreign keys
  console.log("Truncating tables...");

  try {
    // Truncate all tables in one statement with CASCADE
    const tableNames = TABLES.map((t) => t.name).join(", ");
    await db.execute(sql.raw(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`));

    console.log("✅ All tables truncated\n");

    // Verify
    const afterCounts = await getTableCounts(db);
    const totalAfter = Object.values(afterCounts).reduce((a, b) => a + b, 0);

    if (totalAfter === 0) {
      console.log("✨ Database emptied successfully!");
      console.log(`   Deleted ${totalBefore} rows`);
    } else {
      console.error("❌ Some data remains. Check for errors.");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error emptying database:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Parse args
const args = process.argv.slice(2);
const shouldExecute = args.includes("--execute") || args.includes("-e");

if (shouldExecute) {
  execute();
} else {
  dryRun();
}
