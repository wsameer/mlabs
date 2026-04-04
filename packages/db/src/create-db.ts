import { closeSync, existsSync, openSync } from "fs";
import { config } from "dotenv";
import { expand } from "dotenv-expand";
import { ensureDatabaseDirectory, resolveDatabasePath } from "./path.js";

expand(config({ path: "../../.env" }));

async function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined in .env");
  }

  const databasePath = resolveDatabasePath(databaseUrl);
  ensureDatabaseDirectory(databasePath);

  if (existsSync(databasePath)) {
    console.log(`✅ SQLite database already exists at "${databasePath}".`);
    return;
  }

  console.log(`🔧 Creating sqlite database at "${databasePath}"...`);
  const handle = openSync(databasePath, "a");
  closeSync(handle);
  console.log("✅ SQLite database created successfully!");
}

createDatabase();
