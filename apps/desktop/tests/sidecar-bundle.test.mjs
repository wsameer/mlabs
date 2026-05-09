import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url)); // apps/desktop/tests
const tauri = path.resolve(root, "../src-tauri");
const resources = path.join(tauri, "resources");
const bin = path.join(tauri, "bin");

describe("sidecar bundle layout (bun-compiled)", () => {
  it("produces a single Bun-compiled binary at the expected path", () => {
    expect(existsSync(bin)).toBe(true);
    const entries = readdirSync(bin).filter(
      (f) => f.startsWith("mlabs-api-") && !f.endsWith(".sig")
    );
    expect(entries).toEqual(["mlabs-api-aarch64-apple-darwin"]);
    const stat = statSync(path.join(bin, entries[0]));
    expect(stat.isFile()).toBe(true);
    // Bun-compiled binary embeds the Hono+drizzle bundle; should be >20MB.
    expect(stat.size).toBeGreaterThan(20_000_000);
  });

  it("stages migrations, web dist, and the libsql native binding", () => {
    expect(existsSync(path.join(resources, "migrations"))).toBe(true);
    expect(existsSync(path.join(resources, "web", "index.html"))).toBe(true);
    expect(
      existsSync(
        path.join(resources, "node_modules", "@libsql", "darwin-arm64", "index.node")
      )
    ).toBe(true);
  });

  it("stages exactly the libsql native binding (no dep-tree bloat)", () => {
    const nm = path.join(resources, "node_modules");
    const scopes = readdirSync(nm).sort();
    // Only @libsql/darwin-arm64 (the .node native addon) is staged at runtime.
    // All pure-JS packages (@libsql/client, libsql, etc.) are bundled into the binary.
    expect(scopes).toEqual(["@libsql"]);
    const libsqlScope = readdirSync(path.join(nm, "@libsql")).sort();
    expect(libsqlScope).toEqual(["darwin-arm64"]);
  });

  it("stages the drizzle migrations journal", () => {
    expect(
      existsSync(path.join(resources, "migrations", "meta", "_journal.json"))
    ).toBe(true);
  });

  it("does not stage an api/index.js (Bun binary embeds it)", () => {
    expect(existsSync(path.join(resources, "api"))).toBe(false);
  });
});
