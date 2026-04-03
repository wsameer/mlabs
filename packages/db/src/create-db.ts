import postgres from "postgres";
import { config } from "dotenv";
import { expand } from "dotenv-expand";

expand(config({ path: "../../.env" }));

async function createDatabase() {
  const dbName = process.env.POSTGRES_DB;
  const dbUser = process.env.POSTGRES_USER ?? "postgres";
  const dbPassword = process.env.POSTGRES_PASSWORD ?? "postgres";
  const dbHost = process.env.DB_HOST ?? "localhost";
  const dbPort = parseInt(process.env.DB_PORT ?? "5432");

  if (!dbName) {
    throw new Error("POSTGRES_DB is not defined in .env");
  }

  const connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/postgres`;

  console.log(`🔧 Creating database "${dbName}"...`);

  const client = postgres(connectionString);

  try {
    const result = await client`
      SELECT 1 FROM pg_database WHERE datname = ${dbName}
    `;

    if (result.length > 0) {
      console.log(`✅ Database "${dbName}" already exists.`);
      return;
    }

    await client`CREATE DATABASE ${client(dbName)}`;
    console.log(`✅ Database "${dbName}" created successfully!`);
  } catch (error) {
    console.error(`❌ Error creating database:`, error);
    throw error;
  } finally {
    await client.end();
  }
}

createDatabase();
