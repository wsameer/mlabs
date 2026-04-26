import { afterEach, describe, expect, it, vi } from "vitest";

describe("applyMigrationsIfEnabled", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.MIGRATIONS_FOLDER;
  });

  it("is a no-op when MIGRATIONS_FOLDER is unset", async () => {
    const { applyMigrationsIfEnabled } = await import("./migrations.js");
    await expect(applyMigrationsIfEnabled()).resolves.toBeUndefined();
  });

  it("throws when MIGRATIONS_FOLDER points to a missing directory", async () => {
    process.env.MIGRATIONS_FOLDER = "/definitely/does/not/exist/mlabs-test";
    const { applyMigrationsIfEnabled } = await import("./migrations.js");
    await expect(applyMigrationsIfEnabled()).rejects.toThrow(
      /MIGRATIONS_FOLDER/
    );
  });
});
