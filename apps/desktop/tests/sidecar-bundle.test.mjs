import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url)); // apps/desktop/tests
const tauri = path.resolve(root, "../src-tauri");
const resources = path.join(tauri, "resources");
const bin = path.join(tauri, "bin");

describe("sidecar bundle layout", () => {
  it("produces a Node sidecar renamed with the host target triple", () => {
    expect(existsSync(bin)).toBe(true);
    const entries = readdirSync(bin).filter(
      (f) => f.startsWith("mlabs-api-") && !f.endsWith(".sig")
    );
    expect(entries.length).toBeGreaterThan(0);
    const first = entries[0];
    const stat = statSync(path.join(bin, first));
    expect(stat.isFile()).toBe(true);
    expect(stat.size).toBeGreaterThan(5_000_000); // Node binary >5MB
  });

  it("stages the API entry, migrations, web dist, and libsql modules", () => {
    expect(existsSync(path.join(resources, "api", "index.js"))).toBe(true);
    expect(existsSync(path.join(resources, "migrations"))).toBe(true);
    expect(existsSync(path.join(resources, "web", "index.html"))).toBe(true);
    const libsql = path.join(resources, "node_modules", "@libsql");
    expect(existsSync(libsql)).toBe(true);
    expect(readdirSync(libsql).length).toBeGreaterThan(0);
  });

  it("produces syntactically valid JavaScript in api/index.js", () => {
    const entry = path.join(resources, "api", "index.js");
    // node --check exits non-zero on syntax errors
    expect(() =>
      execSync(`node --check "${entry}"`, { stdio: "pipe" })
    ).not.toThrow();
  });

  it("stages the drizzle migrations journal", () => {
    expect(
      existsSync(path.join(resources, "migrations", "meta", "_journal.json"))
    ).toBe(true);
  });
});
