import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";

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
  for (const suffix of ["", "-shm", "-wal"]) {
    const file = `${TEST_DB}${suffix}`;
    try {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } catch {
      // best-effort cleanup
    }
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

describe("mergeAsTransfer — pair case", () => {
  const ACCT_A = "00000000-0000-0000-0000-0000000000c1";
  const ACCT_B = "00000000-0000-0000-0000-0000000000c2";
  const PENDING_OUT = "20000000-0000-0000-0000-000000000001";
  const PENDING_IN = "20000000-0000-0000-0000-000000000002";
  const PAIR_XID = "XFER-PAIR-TEST";

  beforeAll(async () => {
    await dbMod.db.insert(schemaMod.accounts).values([
      {
        id: ACCT_A,
        profileId: PROFILE_ID,
        name: "A",
        group: "chequing",
        currency: "CAD",
        balance: "500",
      },
      {
        id: ACCT_B,
        profileId: PROFILE_ID,
        name: "B",
        group: "chequing",
        currency: "CAD",
        balance: "1000",
      },
    ]);
    await dbMod.db.insert(schemaMod.transactions).values([
      {
        id: PENDING_OUT,
        profileId: PROFILE_ID,
        accountId: ACCT_A,
        categoryId: CAT_A,
        type: "EXPENSE",
        amount: "200",
        description: "A to B",
        date: "2026-05-10",
        transferId: PAIR_XID,
      },
      {
        id: PENDING_IN,
        profileId: PROFILE_ID,
        accountId: ACCT_B,
        categoryId: CAT_B,
        type: "INCOME",
        amount: "200",
        description: "A to B",
        date: "2026-05-10",
        transferId: PAIR_XID,
      },
    ]);
  });

  it("upgrades both legs to TRANSFER and leaves balances unchanged", async () => {
    const before = await dbMod.db.select().from(schemaMod.accounts);
    const balancesBefore = Object.fromEntries(
      before.map((a) => [a.id, a.balance])
    );

    const merged = await service.mergeAsTransfer(PROFILE_ID, PENDING_OUT);

    expect(merged).toHaveLength(2);
    for (const row of merged) expect(row.type).toBe("TRANSFER");
    const ids = merged.map((r) => r.id).sort();
    expect(ids).toEqual([PENDING_IN, PENDING_OUT].sort());
    for (const row of merged) expect(row.transferId).toBe(PAIR_XID);

    const after = await dbMod.db.select().from(schemaMod.accounts);
    const balancesAfter = Object.fromEntries(
      after.map((a) => [a.id, a.balance])
    );
    expect(balancesAfter[ACCT_A]).toBe(balancesBefore[ACCT_A]);
    expect(balancesAfter[ACCT_B]).toBe(balancesBefore[ACCT_B]);

    const rows = await dbMod.db
      .select()
      .from(schemaMod.transactions)
      .where(inArray(schemaMod.transactions.id, [PENDING_OUT, PENDING_IN]));
    expect(rows).toHaveLength(2);
    for (const row of rows) expect(row.categoryId).toBeNull();
  });
});

describe("mergeAsTransfer — orphan case", () => {
  const ACCT_SRC = "00000000-0000-0000-0000-0000000000d1";
  const ACCT_DST = "00000000-0000-0000-0000-0000000000d2";
  const ORPHAN_OUT = "30000000-0000-0000-0000-000000000001";
  const ORPHAN_IN = "30000000-0000-0000-0000-000000000002";

  beforeAll(async () => {
    await dbMod.db.insert(schemaMod.accounts).values([
      {
        id: ACCT_SRC,
        profileId: PROFILE_ID,
        name: "Src",
        group: "chequing",
        currency: "CAD",
        balance: "800",
      },
      {
        id: ACCT_DST,
        profileId: PROFILE_ID,
        name: "Dst",
        group: "chequing",
        currency: "CAD",
        balance: "300",
      },
    ]);
    await dbMod.db.insert(schemaMod.transactions).values([
      {
        id: ORPHAN_OUT,
        profileId: PROFILE_ID,
        accountId: ACCT_SRC,
        categoryId: CAT_A,
        type: "EXPENSE",
        amount: "150",
        description: "Src to Dst",
        date: "2026-05-11",
        transferId: "XFER-ORPH-OUT",
      },
      {
        id: ORPHAN_IN,
        profileId: PROFILE_ID,
        accountId: ACCT_DST,
        categoryId: CAT_B,
        type: "INCOME",
        amount: "50",
        description: "Dst from Src",
        date: "2026-05-12",
        transferId: "XFER-ORPH-IN",
      },
    ]);
  });

  it("creates counter inflow when pending is EXPENSE and credits the destination", async () => {
    const srcBefore = (
      await dbMod.db
        .select()
        .from(schemaMod.accounts)
        .where(eq(schemaMod.accounts.id, ACCT_SRC))
    )[0]?.balance;

    const dstBefore = (
      await dbMod.db
        .select()
        .from(schemaMod.accounts)
        .where(eq(schemaMod.accounts.id, ACCT_DST))
    )[0]?.balance;

    const merged = await service.mergeAsTransfer(PROFILE_ID, ORPHAN_OUT, {
      counterAccountId: ACCT_DST,
    });

    expect(merged).toHaveLength(2);
    for (const row of merged) expect(row.type).toBe("TRANSFER");
    for (const row of merged) expect(row.transferId).toBe("XFER-ORPH-OUT");

    const srcAfter = (
      await dbMod.db
        .select()
        .from(schemaMod.accounts)
        .where(eq(schemaMod.accounts.id, ACCT_SRC))
    )[0]?.balance;

    const dstAfter = (
      await dbMod.db
        .select()
        .from(schemaMod.accounts)
        .where(eq(schemaMod.accounts.id, ACCT_DST))
    )[0]?.balance;

    // Source account balance must be unchanged (only counter/destination is credited)
    expect(srcAfter).toBe(srcBefore);
    expect(Number(dstAfter)).toBe(Number(dstBefore) + 150);

    // Verify the pending row was updated in DB
    const pendingRow = (
      await dbMod.db
        .select()
        .from(schemaMod.transactions)
        .where(eq(schemaMod.transactions.id, ORPHAN_OUT))
    )[0];
    expect(pendingRow?.type).toBe("TRANSFER");
    expect(pendingRow?.categoryId).toBeNull();

    const pendingRowMerged = merged.find((r) => r.id === ORPHAN_OUT);
    const counterRowMerged = merged.find((r) => r.id !== ORPHAN_OUT);
    expect(pendingRowMerged?.direction).toBe("OUTFLOW");
    expect(counterRowMerged?.direction).toBe("INFLOW");
  });

  it("creates counter outflow when pending is INCOME and debits the destination", async () => {
    const dstBefore = (
      await dbMod.db
        .select()
        .from(schemaMod.accounts)
        .where(eq(schemaMod.accounts.id, ACCT_DST))
    )[0]?.balance;

    const srcBefore = (
      await dbMod.db
        .select()
        .from(schemaMod.accounts)
        .where(eq(schemaMod.accounts.id, ACCT_SRC))
    )[0]?.balance;

    const merged = await service.mergeAsTransfer(PROFILE_ID, ORPHAN_IN, {
      counterAccountId: ACCT_SRC,
    });

    expect(merged).toHaveLength(2);
    for (const row of merged) expect(row.type).toBe("TRANSFER");
    for (const row of merged) expect(row.transferId).toBe("XFER-ORPH-IN");

    const dstAfter = (
      await dbMod.db
        .select()
        .from(schemaMod.accounts)
        .where(eq(schemaMod.accounts.id, ACCT_DST))
    )[0]?.balance;

    const srcAfter = (
      await dbMod.db
        .select()
        .from(schemaMod.accounts)
        .where(eq(schemaMod.accounts.id, ACCT_SRC))
    )[0]?.balance;

    // Destination (ACCT_DST) account balance must be unchanged (only counter/source is debited)
    expect(dstAfter).toBe(dstBefore);
    expect(Number(srcAfter)).toBe(Number(srcBefore) - 50);

    // Verify the pending row was updated in DB
    const pendingRow = (
      await dbMod.db
        .select()
        .from(schemaMod.transactions)
        .where(eq(schemaMod.transactions.id, ORPHAN_IN))
    )[0];
    expect(pendingRow?.type).toBe("TRANSFER");
    expect(pendingRow?.categoryId).toBeNull();

    // Direction: pending INCOME row should be labeled INFLOW, not OUTFLOW.
    const pendingRowMerged = merged.find((r) => r.id === ORPHAN_IN);
    const counterRowMerged = merged.find((r) => r.id !== ORPHAN_IN);
    expect(pendingRowMerged?.direction).toBe("INFLOW");
    expect(counterRowMerged?.direction).toBe("OUTFLOW");
  });
});

describe("mergeAsTransfer — errors", () => {
  const ACCT = "00000000-0000-0000-0000-0000000000e1";
  const NO_XID = "40000000-0000-0000-0000-000000000001";
  const ALREADY_T = "40000000-0000-0000-0000-000000000002";
  const AMBIG_1 = "40000000-0000-0000-0000-000000000003";
  const AMBIG_2 = "40000000-0000-0000-0000-000000000004";
  const AMBIG_3 = "40000000-0000-0000-0000-000000000005";
  const ORPHAN = "40000000-0000-0000-0000-000000000006";
  const AMBIG_XID = "XFER-AMBIG";

  beforeAll(async () => {
    await dbMod.db.insert(schemaMod.accounts).values([
      {
        id: ACCT,
        profileId: PROFILE_ID,
        name: "Err",
        group: "chequing",
        currency: "CAD",
        balance: "0",
      },
    ]);
    await dbMod.db.insert(schemaMod.transactions).values([
      {
        id: NO_XID,
        profileId: PROFILE_ID,
        accountId: ACCT,
        type: "EXPENSE",
        amount: "10",
        date: "2026-05-13",
      },
      {
        id: ALREADY_T,
        profileId: PROFILE_ID,
        accountId: ACCT,
        type: "TRANSFER",
        amount: "10",
        date: "2026-05-13",
        transferId: "XFER-T",
      },
      {
        id: AMBIG_1,
        profileId: PROFILE_ID,
        accountId: ACCT,
        type: "EXPENSE",
        amount: "10",
        date: "2026-05-13",
        transferId: AMBIG_XID,
      },
      {
        id: AMBIG_2,
        profileId: PROFILE_ID,
        accountId: ACCT,
        type: "INCOME",
        amount: "10",
        date: "2026-05-13",
        transferId: AMBIG_XID,
      },
      {
        id: AMBIG_3,
        profileId: PROFILE_ID,
        accountId: ACCT,
        type: "INCOME",
        amount: "10",
        date: "2026-05-13",
        transferId: AMBIG_XID,
      },
      {
        id: ORPHAN,
        profileId: PROFILE_ID,
        accountId: ACCT,
        type: "EXPENSE",
        amount: "10",
        date: "2026-05-13",
        transferId: "XFER-LONELY",
      },
    ]);
  });

  it("throws NO_TRANSFER_ID when transferId is null", async () => {
    await expect(
      service.mergeAsTransfer(PROFILE_ID, NO_XID)
    ).rejects.toMatchObject({
      code: "NO_TRANSFER_ID",
    });
  });

  it("throws ALREADY_TRANSFER when row is already TRANSFER", async () => {
    await expect(
      service.mergeAsTransfer(PROFILE_ID, ALREADY_T)
    ).rejects.toMatchObject({
      code: "ALREADY_TRANSFER",
    });
  });

  it("throws AMBIGUOUS_TRANSFER_GROUP when >2 rows share transferId", async () => {
    await expect(
      service.mergeAsTransfer(PROFILE_ID, AMBIG_1)
    ).rejects.toMatchObject({
      code: "AMBIGUOUS_TRANSFER_GROUP",
    });
  });

  it("throws COUNTER_ACCOUNT_REQUIRED for orphan without counterAccountId", async () => {
    await expect(
      service.mergeAsTransfer(PROFILE_ID, ORPHAN)
    ).rejects.toMatchObject({
      code: "COUNTER_ACCOUNT_REQUIRED",
    });
  });

  it("throws SAME_ACCOUNT_TRANSFER when counterAccountId equals source account", async () => {
    await expect(
      service.mergeAsTransfer(PROFILE_ID, ORPHAN, { counterAccountId: ACCT })
    ).rejects.toMatchObject({ code: "SAME_ACCOUNT_TRANSFER" });
  });
});

describe("bulkCreateIncomeExpense — transfer auto-merge sweep", () => {
  const ACCT_X = "00000000-0000-0000-0000-0000000000f1";
  const ACCT_Y = "00000000-0000-0000-0000-0000000000f2";

  beforeAll(async () => {
    await dbMod.db.insert(schemaMod.accounts).values([
      {
        id: ACCT_X,
        profileId: PROFILE_ID,
        name: "Bulk-X",
        group: "chequing",
        currency: "CAD",
        balance: "0",
      },
      {
        id: ACCT_Y,
        profileId: PROFILE_ID,
        name: "Bulk-Y",
        group: "chequing",
        currency: "CAD",
        balance: "0",
      },
    ]);
  });

  it("upgrades both legs to TYPE=TRANSFER when both are imported in one batch", async () => {
    const xid = "XFER-BULK-SAME-BATCH";
    const result = await service.bulkCreateIncomeExpense(PROFILE_ID, [
      {
        type: "EXPENSE",
        accountId: ACCT_X,
        amount: "100.00",
        date: "2026-05-01",
        isCleared: false,
        transferId: xid,
      },
      {
        type: "INCOME",
        accountId: ACCT_Y,
        amount: "100.00",
        date: "2026-05-01",
        isCleared: false,
        transferId: xid,
      },
    ]);

    expect(result.imported).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.mergedTransfers).toBe(1);

    const rows = await dbMod.db
      .select()
      .from(schemaMod.transactions)
      .where(eq(schemaMod.transactions.transferId, xid));
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.type === "TRANSFER")).toBe(true);
    expect(rows.every((r) => r.categoryId === null)).toBe(true);
  });

  it("auto-merges across batches when the counter leg already exists", async () => {
    const xid = "XFER-BULK-CROSS-BATCH";

    const first = await service.bulkCreateIncomeExpense(PROFILE_ID, [
      {
        type: "EXPENSE",
        accountId: ACCT_X,
        amount: "50.00",
        date: "2026-05-02",
        isCleared: false,
        transferId: xid,
      },
    ]);
    expect(first.mergedTransfers).toBe(0);

    const second = await service.bulkCreateIncomeExpense(PROFILE_ID, [
      {
        type: "INCOME",
        accountId: ACCT_Y,
        amount: "50.00",
        date: "2026-05-02",
        isCleared: false,
        transferId: xid,
      },
    ]);
    expect(second.mergedTransfers).toBe(1);

    const rows = await dbMod.db
      .select()
      .from(schemaMod.transactions)
      .where(eq(schemaMod.transactions.transferId, xid));
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.type === "TRANSFER")).toBe(true);
  });

  it("leaves a single leg as pending (transferId set but type !== TRANSFER)", async () => {
    const xid = "XFER-BULK-SOLO";
    const result = await service.bulkCreateIncomeExpense(PROFILE_ID, [
      {
        type: "EXPENSE",
        accountId: ACCT_X,
        amount: "25.00",
        date: "2026-05-03",
        isCleared: false,
        transferId: xid,
      },
    ]);
    expect(result.mergedTransfers).toBe(0);

    const [row] = await dbMod.db
      .select()
      .from(schemaMod.transactions)
      .where(eq(schemaMod.transactions.transferId, xid));
    expect(row?.type).toBe("EXPENSE");
    expect(row?.transferId).toBe(xid);
  });

  it("does not merge ambiguous groups (3+ rows share transferId)", async () => {
    const xid = "XFER-BULK-AMBIG";
    const result = await service.bulkCreateIncomeExpense(PROFILE_ID, [
      {
        type: "EXPENSE",
        accountId: ACCT_X,
        amount: "10.00",
        date: "2026-05-04",
        isCleared: false,
        transferId: xid,
      },
      {
        type: "INCOME",
        accountId: ACCT_Y,
        amount: "10.00",
        date: "2026-05-04",
        isCleared: false,
        transferId: xid,
      },
      {
        type: "EXPENSE",
        accountId: ACCT_X,
        amount: "10.00",
        date: "2026-05-04",
        isCleared: false,
        transferId: xid,
      },
    ]);
    expect(result.mergedTransfers).toBe(0);

    const rows = await dbMod.db
      .select()
      .from(schemaMod.transactions)
      .where(eq(schemaMod.transactions.transferId, xid));
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.type !== "TRANSFER")).toBe(true);
  });

  it("does not merge when both legs land on the same account", async () => {
    const xid = "XFER-BULK-SAME-ACCT";
    const result = await service.bulkCreateIncomeExpense(PROFILE_ID, [
      {
        type: "EXPENSE",
        accountId: ACCT_X,
        amount: "30.00",
        date: "2026-05-05",
        isCleared: false,
        transferId: xid,
      },
      {
        type: "INCOME",
        accountId: ACCT_X,
        amount: "30.00",
        date: "2026-05-05",
        isCleared: false,
        transferId: xid,
      },
    ]);
    expect(result.mergedTransfers).toBe(0);

    const rows = await dbMod.db
      .select()
      .from(schemaMod.transactions)
      .where(eq(schemaMod.transactions.transferId, xid));
    expect(rows.every((r) => r.type !== "TRANSFER")).toBe(true);
  });
});

describe("changeTransactionType — pending pair → TRANSFER", () => {
  // Reproduces the import bug: two IE rows share a transferId, the user opens
  // one and toggles type to TRANSFER. Before the fix this only reversed/deleted
  // the row being edited, leaving the counter leg's IE balance effect intact
  // and creating a brand-new TRANSFER pair on top — double-booking the
  // destination account.
  const ACCT_TD = "00000000-0000-0000-0000-0000000000aa";
  const ACCT_CHQ = "00000000-0000-0000-0000-0000000000ab";
  const PENDING_OUT = "50000000-0000-0000-0000-000000000001";
  const PENDING_IN = "50000000-0000-0000-0000-000000000002";
  const SHARED_XID = "XFER-PENDING-PAIR-TYPECHANGE";

  beforeAll(async () => {
    await dbMod.db.insert(schemaMod.accounts).values([
      {
        id: ACCT_TD,
        profileId: PROFILE_ID,
        name: "TD Savings",
        group: "savings",
        currency: "CAD",
        balance: "101.80",
      },
      {
        id: ACCT_CHQ,
        profileId: PROFILE_ID,
        name: "TD Chequing",
        group: "chequing",
        currency: "CAD",
        balance: "898.20",
      },
    ]);
    // Mimic a bulk-import that landed both legs as IE rows tagged with the
    // same transferId. balances above already reflect both IE deltas.
    await dbMod.db.insert(schemaMod.transactions).values([
      {
        id: PENDING_OUT,
        profileId: PROFILE_ID,
        accountId: ACCT_CHQ,
        categoryId: CAT_A,
        type: "EXPENSE",
        amount: "200.00",
        description: "pending transfer to savings",
        date: "2026-05-20",
        transferId: SHARED_XID,
      },
      {
        id: PENDING_IN,
        profileId: PROFILE_ID,
        accountId: ACCT_TD,
        categoryId: CAT_B,
        type: "INCOME",
        amount: "200.00",
        description: "pending transfer from chequing",
        date: "2026-05-20",
        transferId: SHARED_XID,
      },
    ]);
  });

  it("converting a pending IE leg to TRANSFER preserves both account balances", async () => {
    const before = Object.fromEntries(
      (await dbMod.db.select().from(schemaMod.accounts)).map((a) => [
        a.id,
        a.balance,
      ])
    );

    const result = await service.changeTransactionType(
      PROFILE_ID,
      PENDING_IN,
      {
        type: "TRANSFER",
        fromAccountId: ACCT_CHQ,
        toAccountId: ACCT_TD,
      }
    );

    expect(Array.isArray(result)).toBe(true);
    const rows = result as Awaited<
      ReturnType<typeof service.changeTransactionType>
    > extends infer R
      ? R
      : never;
    if (!Array.isArray(rows)) throw new Error("expected transfer pair");
    expect(rows).toHaveLength(2);
    for (const row of rows) expect(row.type).toBe("TRANSFER");

    const after = Object.fromEntries(
      (await dbMod.db.select().from(schemaMod.accounts)).map((a) => [
        a.id,
        a.balance,
      ])
    );
    // Net-zero: the reversal of the two IE legs plus the new transfer
    // double-entry must leave balances unchanged.
    expect(Number(after[ACCT_TD])).toBe(Number(before[ACCT_TD]));
    expect(Number(after[ACCT_CHQ])).toBe(Number(before[ACCT_CHQ]));

    // The original pair must be gone — only the new transfer pair remains.
    const remaining = await dbMod.db
      .select()
      .from(schemaMod.transactions)
      .where(eq(schemaMod.transactions.profileId, PROFILE_ID));
    const xidRows = remaining.filter((r) => r.transferId === SHARED_XID);
    expect(xidRows).toHaveLength(0);
    // Exactly one transfer pair landed for these two accounts.
    const newTransferRows = remaining.filter(
      (r) =>
        r.type === "TRANSFER" &&
        (r.accountId === ACCT_TD || r.accountId === ACCT_CHQ)
    );
    expect(newTransferRows).toHaveLength(2);
  });
});

describe("listTransactions — pendingTransfersOnly", () => {
  const ACCT_P = "00000000-0000-0000-0000-0000000000f3";
  const PENDING_TX = "30000000-0000-0000-0000-0000000000a1";

  beforeAll(async () => {
    await dbMod.db.insert(schemaMod.accounts).values({
      id: ACCT_P,
      profileId: PROFILE_ID,
      name: "Pending-Acct",
      group: "chequing",
      currency: "CAD",
      balance: "0",
    });
    await dbMod.db.insert(schemaMod.transactions).values({
      id: PENDING_TX,
      profileId: PROFILE_ID,
      accountId: ACCT_P,
      type: "EXPENSE",
      amount: "12.34",
      description: "pending solo",
      date: "2026-05-10",
      transferId: "XFER-PENDING-FILTER",
    });
  });

  it("returns only rows with transferId set and type != TRANSFER", async () => {
    const { transactions: rows } = await service.listTransactions(PROFILE_ID, {
      pendingTransfersOnly: true,
    });
    const descs = rows.map((r) => r.description);
    expect(descs).toContain("pending solo");
    expect(rows.every((r) => r.type !== "TRANSFER")).toBe(true);
    expect(rows.every((r) => r.transferId != null)).toBe(true);
  });
});
