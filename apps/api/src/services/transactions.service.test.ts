import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const TEST_DB = path.join(
  os.tmpdir(),
  `mlabs-test-${Date.now()}-${process.pid}.db`
);
process.env.DATABASE_URL = TEST_DB;

const PROFILE_ID = "00000000-0000-0000-0000-000000000001";
const ACCOUNT_ID = "00000000-0000-0000-0000-000000000101";
const CAT_A = "00000000-0000-0000-0000-0000000000aa";
const CAT_B = "00000000-0000-0000-0000-0000000000bb";

let service: import("./transactions.service.js").TransactionsService;
let dbMod: typeof import("../libs/db.js");
let schemaMod: typeof import("@workspace/db");

beforeAll(async () => {
  // Apply migrations against the temp DB
  const { migrate } = await import("drizzle-orm/libsql/migrator");
  dbMod = await import("../libs/db.js");
  schemaMod = await import("@workspace/db");
  const migrationsFolder = path.resolve(
    __dirname,
    "../../../../packages/db/migrations"
  );
  await migrate(dbMod.db, { migrationsFolder });

  const { TransactionsService } = await import("./transactions.service.js");
  service = new TransactionsService();

  // Clean any existing rows (paranoid on a fresh temp db)
  await dbMod.db.delete(schemaMod.transactions);
  await dbMod.db.delete(schemaMod.accounts);
  await dbMod.db.delete(schemaMod.categories);
  await dbMod.db.delete(schemaMod.profiles);

  // Seed
  await dbMod.db.insert(schemaMod.profiles).values({
    id: PROFILE_ID,
    name: "Test",
    type: "PERSONAL",
  });
  await dbMod.db.insert(schemaMod.accounts).values({
    id: ACCOUNT_ID,
    profileId: PROFILE_ID,
    name: "Checking",
    group: "chequing",
    currency: "CAD",
  });
  await dbMod.db.insert(schemaMod.categories).values([
    { id: CAT_A, profileId: PROFILE_ID, name: "Groceries", type: "EXPENSE" },
    { id: CAT_B, profileId: PROFILE_ID, name: "Dining", type: "EXPENSE" },
  ]);
  await dbMod.db.insert(schemaMod.transactions).values([
    {
      id: "10000000-0000-0000-0000-000000000001",
      profileId: PROFILE_ID,
      accountId: ACCOUNT_ID,
      categoryId: CAT_A,
      type: "EXPENSE",
      amount: "10.00",
      description: "cat-a expense",
      date: "2026-04-10",
    },
    {
      id: "10000000-0000-0000-0000-000000000002",
      profileId: PROFILE_ID,
      accountId: ACCOUNT_ID,
      categoryId: CAT_B,
      type: "EXPENSE",
      amount: "20.00",
      description: "cat-b expense",
      date: "2026-04-11",
    },
    {
      id: "10000000-0000-0000-0000-000000000003",
      profileId: PROFILE_ID,
      accountId: ACCOUNT_ID,
      categoryId: null,
      type: "EXPENSE",
      amount: "30.00",
      description: "uncategorized expense",
      date: "2026-04-12",
    },
    {
      id: "10000000-0000-0000-0000-000000000004",
      profileId: PROFILE_ID,
      accountId: ACCOUNT_ID,
      categoryId: null,
      type: "TRANSFER",
      amount: "40.00",
      description: "transfer leg",
      date: "2026-04-13",
    },
  ]);
});

afterAll(async () => {
  try {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  } catch {
    // best-effort cleanup
  }
});

describe("listTransactions — filters", () => {
  it("filters by a single category via categoryIds", async () => {
    const { transactions: rows } = await service.listTransactions(PROFILE_ID, {
      categoryIds: [CAT_A],
    });
    const descs = rows.map((r) => r.description);
    expect(descs).toEqual(["cat-a expense"]);
  });

  it("filters by multiple categories via categoryIds", async () => {
    const { transactions: rows } = await service.listTransactions(PROFILE_ID, {
      categoryIds: [CAT_A, CAT_B],
    });
    const descs = rows.map((r) => r.description).sort();
    expect(descs).toEqual(["cat-a expense", "cat-b expense"]);
  });

  it("uncategorizedOnly=true returns only null-category non-transfers", async () => {
    const { transactions: rows } = await service.listTransactions(PROFILE_ID, {
      uncategorizedOnly: true,
    });
    const descs = rows.map((r) => r.description);
    expect(descs).toEqual(["uncategorized expense"]);
  });

  it("uncategorizedOnly=true ignores categoryIds when both are provided", async () => {
    const { transactions: rows } = await service.listTransactions(PROFILE_ID, {
      uncategorizedOnly: true,
      categoryIds: [CAT_A],
    });
    const descs = rows.map((r) => r.description);
    expect(descs).toEqual(["uncategorized expense"]);
  });
});
