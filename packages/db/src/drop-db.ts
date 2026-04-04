import { existsSync, unlinkSync } from "fs";
import { config } from "dotenv";
import { expand } from "dotenv-expand";
import { resolveDatabasePath } from "./path.js";

expand(config({ path: "../../.env" }));

function safeDelete(path: string) {
  if (existsSync(path)) {
    unlinkSync(path);
  }
}

async function dropDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined in .env");
  }

  const databasePath = resolveDatabasePath(databaseUrl);
  const walPath = `${databasePath}-wal`;
  const shmPath = `${databasePath}-shm`;

  console.log(`⚠️  Dropping sqlite database at "${databasePath}"...`);

  safeDelete(walPath);
  safeDelete(shmPath);
  safeDelete(databasePath);

  console.log("✅ SQLite database dropped successfully!");
}

dropDatabase();
