import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

const TEST_DB = path.join(
  os.tmpdir(),
  `mlabs-reports-test-${Date.now()}-${process.pid}.db`
);
process.env.DATABASE_URL = TEST_DB;

const PROFILE_ID = "00000000-0000-0000-0000-000000000201";
const ACCOUNT_ID = "00000000-0000-0000-0000-000000000202";
const CATEGORY_ID = "00000000-0000-0000-0000-000000000203";

let service: import("./reports.service.js").ReportsService;
let dbMod: typeof import("../libs/db.js");
let schemaMod: typeof import("@workspace/db");

beforeAll(async () => {
  const { migrate } = await import("drizzle-orm/libsql/migrator");
  dbMod = await import("../libs/db.js");
  schemaMod = await import("@workspace/db");
  const migrationsFolder = path.resolve(
    __dirname,
    "../../../../packages/db/migrations"
  );
  await migrate(dbMod.db, { migrationsFolder });

  const { ReportsService } = await import("./reports.service.js");
  service = new ReportsService();

  await dbMod.db.delete(schemaMod.transactions);
  await dbMod.db.delete(schemaMod.accounts);
  await dbMod.db.delete(schemaMod.categories);
  await dbMod.db.delete(schemaMod.profiles);

  await dbMod.db.insert(schemaMod.profiles).values({
    id: PROFILE_ID,
    name: "Reports Test",
    type: "PERSONAL",
  });
  await dbMod.db.insert(schemaMod.accounts).values({
    id: ACCOUNT_ID,
    profileId: PROFILE_ID,
    name: "Checking",
    group: "chequing",
    currency: "CAD",
  });
  await dbMod.db.insert(schemaMod.categories).values({
    id: CATEGORY_ID,
    profileId: PROFILE_ID,
    name: "Salary",
    type: "INCOME",
  });
  await dbMod.db.insert(schemaMod.transactions).values([
    {
      id: "10000000-0000-0000-0000-000000000201",
      profileId: PROFILE_ID,
      accountId: ACCOUNT_ID,
      categoryId: CATEGORY_ID,
      type: "INCOME",
      amount: "100.00",
      description: "older income",
      date: "2025-01-15",
    },
    {
      id: "10000000-0000-0000-0000-000000000202",
      profileId: PROFILE_ID,
      accountId: ACCOUNT_ID,
      categoryId: CATEGORY_ID,
      type: "INCOME",
      amount: "250.00",
      description: "newer income",
      date: "2026-05-15",
    },
  ]);
});

afterAll(async () => {
  for (const suffix of ["", "-shm", "-wal"]) {
    const file = `${TEST_DB}${suffix}`;
    try {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } catch {
      // best-effort cleanup
    }
  }
});

describe("getCategoryTotals", () => {
  it("returns all matching transactions when no date range is provided", async () => {
    const result = await service.getCategoryTotals(PROFILE_ID, {
      type: "INCOME",
    });

    expect(result.grandTotal).toBe("350");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.transactionCount).toBe(2);
  });

  it("excludes pending transfer legs (rows with transferId set)", async () => {
    // Tag a row as a pending transfer leg and confirm it drops out of the
    // income totals — otherwise transfers between own accounts inflate income.
    await dbMod.db.insert(schemaMod.transactions).values({
      id: "10000000-0000-0000-0000-000000000299",
      profileId: PROFILE_ID,
      accountId: ACCOUNT_ID,
      categoryId: CATEGORY_ID,
      type: "INCOME",
      amount: "999.00",
      description: "pending transfer in",
      date: "2026-05-20",
      transferId: "XFER-REPORT-EXCLUDE",
    });

    const result = await service.getCategoryTotals(PROFILE_ID, {
      type: "INCOME",
    });

    expect(result.grandTotal).toBe("350");
    expect(result.items[0]?.transactionCount).toBe(2);

    await dbMod.db
      .delete(schemaMod.transactions)
      .where(
        eq(
          schemaMod.transactions.id,
          "10000000-0000-0000-0000-000000000299"
        )
      );
  });
});
