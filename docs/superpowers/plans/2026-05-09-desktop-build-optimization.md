# Desktop Build Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Node.js sidecar (full Node binary + walked `node_modules` + esbuild bundle) with a Bun-compiled single-file binary plus a tiny libsql-only `node_modules` tree, reducing the macOS `.app` size by 50%+ and speeding cold start.

**Architecture:** Tauri shell + sidecar architecture is preserved. Only the sidecar packaging changes. `apps/api/src/index.ts` is compiled to a self-contained Bun binary at `src-tauri/bin/mlabs-api-aarch64-apple-darwin`. The libsql packages (`@libsql/client`, `libsql`, `@libsql/darwin-arm64`) are kept external and staged at `src-tauri/resources/node_modules/` so the native `index.node` binding can be `dlopen()`'d at runtime via `NODE_PATH`. Cargo release profile and Vite config get small tuning. Apple Silicon only, unsigned.

**Tech Stack:** Tauri v2 (Rust), Bun 1.3+ (`bun build --compile`), Hono, Drizzle ORM, libsql, Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-05-09-desktop-build-optimization-design.md`

---

## File Structure

**Created:**
- (none — this plan only modifies and deletes)

**Modified:**
- `apps/desktop/scripts/build-sidecar.mjs` — rewritten: Bun-compile + libsql-only staging
- `apps/desktop/scripts/smoke-sidecar.mjs` — drop `apiEntry` arg, add DB-touching probe
- `apps/desktop/tests/sidecar-bundle.test.mjs` — assertions match new bundle layout
- `apps/desktop/src-tauri/src/sidecar.rs` — drop `api_entry` arg & resource lookup
- `apps/desktop/src-tauri/Cargo.toml` — add `[profile.release]`
- `apps/desktop/vite.config.ts` — make `minify` explicit (cosmetic)

**Unchanged but referenced:**
- `apps/api/src/index.ts` — entry point Bun compiles
- `apps/api/src/routes/bootstrap.ts` — public DB-touching route used by smoke test
- `packages/db/src/index.ts` — imports `@libsql/client` (resolved via `NODE_PATH`)
- `apps/desktop/src-tauri/tauri.conf.json` — `externalBin` and `resources` globs already correct

---

## Baseline Capture (Task 0)

Capture sizes/timings of the *current* implementation before touching anything. We need a number to compare against in the success criteria.

### Task 0: Capture baseline metrics

**Files:**
- No code changes. Output goes into a scratchpad markdown commit message.

- [ ] **Step 1: Stage the current sidecar artifacts**

Run:
```bash
pnpm --filter desktop sidecar
```
Expected: completes with `Done.` and no errors.

- [ ] **Step 2: Record artifact sizes**

Run:
```bash
du -sh apps/desktop/src-tauri/bin
du -sh apps/desktop/src-tauri/resources
du -sh apps/desktop/src-tauri/resources/node_modules
du -sh apps/desktop/src-tauri/resources/api 2>/dev/null || true
ls -la apps/desktop/src-tauri/bin
```
Expected: bin ≥ 50MB (Node binary), resources/node_modules ~80–100MB.

Write the numbers into `docs/superpowers/plans/2026-05-09-desktop-build-optimization.md` at the bottom under a new `## Baseline (recorded)` section, formatted as:

```markdown
## Baseline (recorded YYYY-MM-DD)

- `src-tauri/bin/`: <size>
- `src-tauri/resources/`: <size>
- `src-tauri/resources/node_modules/`: <size>
- `src-tauri/resources/api/index.js`: <size>
```

- [ ] **Step 3: Commit the baseline numbers**

```bash
git add docs/superpowers/plans/2026-05-09-desktop-build-optimization.md
git commit -m "docs(desktop): record baseline sizes before bun migration"
```

---

## Task 1: Add a Bun preflight check to the staging script

The staging script must fail fast and informatively if Bun isn't installed. We'll add only the preflight first — the rest of the script keeps working as-is.

**Files:**
- Modify: `apps/desktop/scripts/build-sidecar.mjs`

- [ ] **Step 1: Add `preflightBun()` near the top of the script (after `run()`)**

Insert this function right after the `run()` helper (around line 26):

```javascript
function preflightBun() {
  try {
    const version = execSync("bun --version", { encoding: "utf8" }).trim();
    console.log(`Using bun ${version}`);
  } catch {
    throw new Error(
      "bun is required but not on PATH. Install with:\n" +
      "  curl -fsSL https://bun.sh/install | bash"
    );
  }
}
```

- [ ] **Step 2: Call `preflightBun()` first in `main()`**

Update `main()` (currently at the bottom of the file) so the first call after the `console.log("Staging...")` is `preflightBun()`:

```javascript
function main() {
  console.log("Staging mLabs desktop sidecar artifacts...");
  preflightBun();
  clean();
  stageApi();
  stageWeb();
  stageMigrations();
  stageNodeModules();
  stageNodeBinary();
  console.log("Done.");
}
```

- [ ] **Step 3: Run the staging script and verify the preflight log line appears**

Run:
```bash
pnpm --filter desktop sidecar 2>&1 | head -3
```
Expected: first non-banner line is `Using bun <version>` (e.g. `Using bun 1.3.10`). Script still completes successfully.

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/scripts/build-sidecar.mjs
git commit -m "feat(desktop): add bun preflight to sidecar staging"
```

---

## Task 2: Add `stageBunSidecar()` alongside the existing Node staging

We add the new path *next to* the old one before deleting the old one. This lets us run both, compare output sizes, and revert easily if Bun produces a broken binary.

**Files:**
- Modify: `apps/desktop/scripts/build-sidecar.mjs`

- [ ] **Step 1: Add `stageBunSidecar()` function**

Insert this function in `build-sidecar.mjs`, anywhere after the `clean()` function and before `main()`:

```javascript
function stageBunSidecar() {
  const triple = "aarch64-apple-darwin"; // arm64 macOS only per spec
  const dest = path.join(bin, `mlabs-api-${triple}`);
  const entry = path.join(repoRoot, "apps", "api", "src", "index.ts");
  const cmd = [
    "bun build",
    `"${entry}"`,
    "--compile",
    "--target=bun-darwin-arm64",
    "--minify",
    "--external @libsql/client",
    "--external libsql",
    "--external @libsql/darwin-arm64",
    `--outfile "${dest}"`,
  ].join(" ");
  run(cmd);
  execSync(`chmod +x "${dest}"`);
  const stat = statSync(dest);
  if (stat.size < 20_000_000) {
    throw new Error(
      `Bun-compiled sidecar is suspiciously small (${stat.size} bytes); expected >20MB`
    );
  }
  console.log(`Staged Bun sidecar: ${dest} (${stat.size} bytes)`);
}
```

- [ ] **Step 2: Verify `stageBunSidecar()` works in isolation**

Quick scratch invocation: temporarily add `stageBunSidecar();` as the *last* line of `main()` (after `stageNodeBinary()` so we don't disturb existing behavior — the function will overwrite the Node-binary copy at `bin/mlabs-api-aarch64-apple-darwin`):

```javascript
function main() {
  console.log("Staging mLabs desktop sidecar artifacts...");
  preflightBun();
  clean();
  stageApi();
  stageWeb();
  stageMigrations();
  stageNodeModules();
  stageNodeBinary();
  stageBunSidecar(); // TEMPORARY: will replace stageNodeBinary in next task
  console.log("Done.");
}
```

Run:
```bash
pnpm --filter desktop sidecar
ls -lh apps/desktop/src-tauri/bin/mlabs-api-aarch64-apple-darwin
file apps/desktop/src-tauri/bin/mlabs-api-aarch64-apple-darwin
```
Expected: file is 50–80MB (much smaller than the >100MB Node binary copy *plus* the embedded JS bundle implied by Bun compile). `file` reports it as a Mach-O 64-bit executable arm64.

- [ ] **Step 3: Verify the binary launches and prints help/version-style output without crashing**

Run (from `apps/desktop/src-tauri`):
```bash
./bin/mlabs-api-aarch64-apple-darwin --help 2>&1 | head -5 || true
echo "Exit: $?"
```
Note: the API has no `--help` flag — but the binary should at least *load* (not segfault) before failing for missing env vars. Any stdout/stderr that's not a crash is a pass. A non-zero exit is fine here; what we're checking is that Bun produced a runnable file.

- [ ] **Step 4: Remove the temporary call**

Edit `main()` to remove the `stageBunSidecar();` line we just added — we'll wire it in properly in Task 3. Leave the function definition.

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/scripts/build-sidecar.mjs
git commit -m "feat(desktop): add bun-compile staging function (not yet wired)"
```

---

## Task 3: Add `stageLibsqlModules()` to stage just the libsql packages

This replaces the dep-walking `stageNodeModules`. We stage three packages directly: `@libsql/client`, `libsql`, `@libsql/darwin-arm64`. We reuse the existing `findDep()` helper.

**Files:**
- Modify: `apps/desktop/scripts/build-sidecar.mjs`

- [ ] **Step 1: Add `stageLibsqlModules()` function**

Insert after `stageBunSidecar()`:

```javascript
function stageLibsqlModules() {
  const nmOut = path.join(resources, "node_modules");
  mkdirSync(nmOut, { recursive: true });
  const libsqlPkgs = ["@libsql/client", "libsql", "@libsql/darwin-arm64"];
  for (const dep of libsqlPkgs) {
    const src = findDep(dep);
    if (!src) {
      throw new Error(`Required libsql package not found in workspace: ${dep}`);
    }
    const destDir = path.join(nmOut, dep);
    mkdirSync(path.dirname(destDir), { recursive: true });
    cpSync(src, destDir, { recursive: true, dereference: true });
    console.log(`Staged ${dep} from ${src}`);
  }
  // Sanity-check the native binding actually got copied.
  const nodeBinding = path.join(
    nmOut,
    "@libsql",
    "darwin-arm64",
    "index.node"
  );
  if (!existsSync(nodeBinding)) {
    throw new Error(
      `libsql native binding missing after staging: ${nodeBinding}`
    );
  }
  const stat = statSync(nodeBinding);
  if (stat.size < 1_000_000) {
    throw new Error(
      `libsql native binding suspiciously small (${stat.size} bytes); expected >1MB`
    );
  }
}
```

- [ ] **Step 2: Verify the function works in isolation**

Temporarily add `stageLibsqlModules();` to the end of `main()` (after `stageNodeBinary()`), but DON'T remove the existing `stageNodeModules()` yet:

```javascript
function main() {
  console.log("Staging mLabs desktop sidecar artifacts...");
  preflightBun();
  clean();
  stageApi();
  stageWeb();
  stageMigrations();
  stageNodeModules();
  stageNodeBinary();
  stageLibsqlModules(); // TEMPORARY
  console.log("Done.");
}
```

Run:
```bash
pnpm --filter desktop sidecar
ls apps/desktop/src-tauri/resources/node_modules/@libsql/
ls -lh apps/desktop/src-tauri/resources/node_modules/@libsql/darwin-arm64/index.node
```
Expected:
- `@libsql/` contains `client/` and `darwin-arm64/` (and the `libsql/` peer is at `node_modules/libsql/`)
- `index.node` exists and is ~10MB

- [ ] **Step 3: Remove the temporary call**

Remove the `stageLibsqlModules();` line from `main()` (we'll wire it in properly in Task 4). Leave the function definition.

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/scripts/build-sidecar.mjs
git commit -m "feat(desktop): add libsql-only node_modules staging"
```

---

## Task 4: Switch `main()` to the new staging pipeline and remove dead code

Now we cut over and delete the old `stageApi`, `stageNodeBinary`, `stageNodeModules`, `resolveEsbuild`, `targetTriple`, and `ROOT_DEPS`. `findDep` stays.

**Files:**
- Modify: `apps/desktop/scripts/build-sidecar.mjs`

- [ ] **Step 1: Rewrite `main()`**

Replace the entire `main()` function with:

```javascript
function main() {
  console.log("Staging mLabs desktop sidecar artifacts...");
  preflightBun();
  clean();
  stageBunSidecar();
  stageLibsqlModules();
  stageWeb();
  stageMigrations();
  console.log("Done.");
}
```

- [ ] **Step 2: Delete dead functions**

Remove these function definitions entirely from `build-sidecar.mjs`:
- `targetTriple()`
- `stageNodeBinary()`
- `resolveEsbuild()`
- `stageApi()`
- `stageNodeModules()`
- The `ROOT_DEPS` constant

Keep:
- All imports
- The path constants (`__dirname`, `desktopRoot`, `repoRoot`, `tauri`, `resources`, `bin`)
- `run()`, `clean()`, `preflightBun()`
- `stageBunSidecar()`, `stageLibsqlModules()`, `stageWeb()`, `stageMigrations()`
- `findDep()` (used by `stageLibsqlModules`)
- The `try/catch` `main()` invocation at the bottom

After deletion, the file should be ~120 lines (was ~250+).

- [ ] **Step 3: Run the rewritten staging end-to-end**

Run:
```bash
pnpm --filter desktop sidecar
```
Expected: completes with `Done.` Final layout:
```bash
ls apps/desktop/src-tauri/bin/
# → mlabs-api-aarch64-apple-darwin
ls apps/desktop/src-tauri/resources/
# → migrations  node_modules  web
ls apps/desktop/src-tauri/resources/node_modules/
# → @libsql  libsql
```
There should be no `resources/api/` directory.

- [ ] **Step 4: Record new artifact sizes**

Run:
```bash
du -sh apps/desktop/src-tauri/bin
du -sh apps/desktop/src-tauri/resources
du -sh apps/desktop/src-tauri/resources/node_modules
```

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/scripts/build-sidecar.mjs
git commit -m "refactor(desktop): switch sidecar staging to bun-compile + libsql-only"
```

---

## Task 5: Update `sidecar-bundle.test.mjs` to match new layout

The Vitest assertions still expect the old layout (`resources/api/index.js`, dep-walked `node_modules`). They need to match the new layout, otherwise `pnpm --filter desktop test` will fail.

**Files:**
- Modify: `apps/desktop/tests/sidecar-bundle.test.mjs`

- [ ] **Step 1: Read the current test to confirm what's there**

Run:
```bash
cat apps/desktop/tests/sidecar-bundle.test.mjs
```
You should see four `it(...)` blocks asserting the old layout.

- [ ] **Step 2: Replace the test contents**

Overwrite the entire file with:

```javascript
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

  it("stages exactly the libsql packages (no dep-tree bloat)", () => {
    const nm = path.join(resources, "node_modules");
    const scopes = readdirSync(nm).sort();
    // We expect @libsql (client + darwin-arm64) plus libsql. No other top-level entries.
    expect(scopes).toEqual(["@libsql", "libsql"]);
    const libsqlScope = readdirSync(path.join(nm, "@libsql")).sort();
    expect(libsqlScope).toEqual(["client", "darwin-arm64"]);
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
```

- [ ] **Step 3: Run the tests**

Run:
```bash
pnpm --filter desktop test
```
Expected: all 5 `sidecar bundle layout` tests pass, plus the existing `errors.test.ts` and `healthcheck.test.ts` tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/tests/sidecar-bundle.test.mjs
git commit -m "test(desktop): assertions match bun-compiled bundle layout"
```

---

## Task 6: Update `smoke-sidecar.mjs` to spawn the new binary and probe the DB

Today's smoke script: spawns sidecar with `apiEntry` as arg, pings `/api/health`. New script: no positional args, ping `/api/health` *and* `/api/bootstrap` (which reads from the DB), and gate on both passing.

**Files:**
- Modify: `apps/desktop/scripts/smoke-sidecar.mjs`

- [ ] **Step 1: Replace the file's contents**

Overwrite `apps/desktop/scripts/smoke-sidecar.mjs` with:

```javascript
#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(__dirname, "..");
const tauri = path.join(desktopRoot, "src-tauri");
const resources = path.join(tauri, "resources");
const bin = path.join(tauri, "bin");

const SMOKE_PORT = 39099;

async function waitForOk(url, { retries = 80, delayMs = 250, isChildAlive } = {}) {
  for (let i = 0; i < retries; i++) {
    if (isChildAlive && !isChildAlive()) {
      throw new Error(`sidecar exited before ${url} became ready`);
    }
    try {
      const res = await fetch(url);
      if (res.ok) return res;
    } catch {}
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`endpoint never ready: ${url}`);
}

async function main() {
  const sidecar = path.join(bin, "mlabs-api-aarch64-apple-darwin");
  if (!existsSync(sidecar)) {
    throw new Error(
      `Sidecar binary not found at ${sidecar}. Run 'pnpm --filter desktop sidecar' first.`
    );
  }
  const nodeModules = path.join(resources, "node_modules");
  if (!existsSync(nodeModules)) {
    throw new Error(
      `Staged node_modules missing at ${nodeModules}. Run 'pnpm --filter desktop sidecar' first.`
    );
  }

  const tmp = mkdtempSync(path.join(os.tmpdir(), "mlabs-smoke-"));
  const dbPath = path.join(tmp, "mlabs.db");
  const env = {
    ...process.env,
    NODE_ENV: "production",
    HOST: "127.0.0.1",
    PORT: String(SMOKE_PORT),
    DATABASE_URL: dbPath,
    CORS_ORIGIN: `http://127.0.0.1:${SMOKE_PORT}`,
    WEB_DIST_PATH: path.join(resources, "web"),
    MIGRATIONS_FOLDER: path.join(resources, "migrations"),
    NODE_PATH: nodeModules,
  };

  let childAlive = true;
  let spawnError = null;

  // No positional args — Bun-compiled binary embeds its entry.
  const child = spawn(sidecar, [], {
    env,
    stdio: ["ignore", "inherit", "inherit"],
  });

  child.on("error", (err) => {
    spawnError = err;
    childAlive = false;
  });
  child.on("exit", () => {
    childAlive = false;
  });

  const onSignal = () => {
    child.kill("SIGTERM");
    process.exit(130);
  };
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);

  try {
    await waitForOk(`http://127.0.0.1:${SMOKE_PORT}/api/health`, {
      isChildAlive: () => childAlive,
    });
    if (spawnError) throw spawnError;
    if (!readdirSync(tmp).includes("mlabs.db")) {
      throw new Error("DB file was not created");
    }
    // DB-touching probe: bootstrap is a public route that reads the profiles table.
    // If libsql native binding loaded correctly, this returns 200 with a JSON body.
    const res = await waitForOk(`http://127.0.0.1:${SMOKE_PORT}/api/bootstrap`, {
      isChildAlive: () => childAlive,
      retries: 20,
    });
    const body = await res.json();
    if (typeof body !== "object" || body === null) {
      throw new Error(`/api/bootstrap returned unexpected body: ${JSON.stringify(body)}`);
    }
    console.log("smoke: OK (health + bootstrap)");
  } finally {
    if (childAlive) child.kill("SIGTERM");
    rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("smoke: FAILED", err.message || err);
  process.exit(1);
});
```

- [ ] **Step 2: Run the smoke test**

Run:
```bash
pnpm --filter desktop smoke
```
Expected: prints `smoke: OK (health + bootstrap)` and exits 0.

If it fails on `/api/health` — Bun couldn't load libsql via NODE_PATH. Check stderr for the actual error. The most likely cause is a missing peer dep next to `libsql` in the staged tree; if so, add the missing dep name to the `libsqlPkgs` array in `build-sidecar.mjs` `stageLibsqlModules()` and re-stage.

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/scripts/smoke-sidecar.mjs
git commit -m "test(desktop): smoke probes /api/bootstrap to exercise libsql"
```

---

## Task 7: Update `sidecar.rs` to drop the `api_entry` arg

Now that the binary is self-contained (no JS path arg needed) and `resources/api/` is gone, the Rust spawn must stop passing the entry path.

**Files:**
- Modify: `apps/desktop/src-tauri/src/sidecar.rs`

- [ ] **Step 1: Edit `sidecar::start()`**

In `apps/desktop/src-tauri/src/sidecar.rs`, find this block (currently around lines 47-72):

```rust
pub fn start(app: &AppHandle) -> Result<(), SidecarError> {
    preflight_port(API_PORT)?;

    let app_data = resolve_app_data(app)?;
    let db_path = app_data.join("mlabs.db");
    let api_entry = resolve_resource(app, "resources/api/index.js")?;
    let web_dist = resolve_resource(app, "resources/web")?;
    let migrations = resolve_resource(app, "resources/migrations")?;
    let node_modules = resolve_resource(app, "resources/node_modules")?;
```

And the spawn block:

```rust
    let sidecar = app
        .shell()
        .sidecar("mlabs-api")
        .map_err(|e| SidecarError::Spawn(e.to_string()))?
        .args([api_entry.to_string_lossy().to_string()])
        .env("NODE_ENV", "production")
```

Make two changes:
1. Remove the `api_entry` line entirely.
2. Remove the `.args([...])` line entirely (Bun binary needs no args).

After the edit, the function should look like:

```rust
pub fn start(app: &AppHandle) -> Result<(), SidecarError> {
    preflight_port(API_PORT)?;

    let app_data = resolve_app_data(app)?;
    let db_path = app_data.join("mlabs.db");
    let web_dist = resolve_resource(app, "resources/web")?;
    let migrations = resolve_resource(app, "resources/migrations")?;
    let node_modules = resolve_resource(app, "resources/node_modules")?;

    // Allow the API to accept /api/health pings from the Tauri webview origin
    // (which is tauri://localhost in prod, http://localhost:1420 in dev) as
    // well as the real UI origin once we redirect to it.
    let cors_origin =
        format!("http://{API_HOST}:{API_PORT},http://localhost:1420,tauri://localhost,http://tauri.localhost");
    let port_str = API_PORT.to_string();

    let sidecar = app
        .shell()
        .sidecar("mlabs-api")
        .map_err(|e| SidecarError::Spawn(e.to_string()))?
        .env("NODE_ENV", "production")
        .env("HOST", API_HOST)
        .env("PORT", &port_str)
        .env("DATABASE_URL", db_path.to_string_lossy().to_string())
        .env("CORS_ORIGIN", &cors_origin)
        .env("LOG_LEVEL", "info")
        .env("WEB_DIST_PATH", web_dist.to_string_lossy().to_string())
        .env("MIGRATIONS_FOLDER", migrations.to_string_lossy().to_string())
        .env("NODE_PATH", node_modules.to_string_lossy().to_string());

    let (mut rx, child) = sidecar
        .spawn()
        .map_err(|e| SidecarError::Spawn(e.to_string()))?;
    // ... rest unchanged
```

- [ ] **Step 2: Verify Rust still compiles**

Run:
```bash
cd apps/desktop/src-tauri && cargo check
```
Expected: `Finished` with no errors. (Warnings about unused imports are fine.)

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src-tauri/src/sidecar.rs
git commit -m "refactor(desktop): drop api_entry arg from sidecar spawn"
```

---

## Task 8: Add the Cargo release profile

Tune the Rust binary for size and runtime. This affects only release builds; `cargo check` and `tauri dev` still use the default debug profile.

**Files:**
- Modify: `apps/desktop/src-tauri/Cargo.toml`

- [ ] **Step 1: Append the release profile**

Add this block to the *end* of `apps/desktop/src-tauri/Cargo.toml`:

```toml

[profile.release]
lto = "thin"
codegen-units = 1
strip = true
panic = "abort"
```

The leading blank line matters (TOML section separation).

- [ ] **Step 2: Verify Cargo accepts the profile**

Run:
```bash
cd apps/desktop/src-tauri && cargo check --release 2>&1 | tail -5
```
Expected: profile is accepted; build runs (may take a while on first run). If you see warnings about `panic = "abort"` and panic-unwinding test crates, those are fine — we don't have a test crate at the Tauri layer.

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src-tauri/Cargo.toml
git commit -m "perf(desktop): tune cargo release profile (lto, strip)"
```

---

## Task 9: Make `vite.config.ts` minify explicit

Cosmetic — declares intent. The default is already `esbuild` minify, but the spec calls this out.

**Files:**
- Modify: `apps/desktop/vite.config.ts`

- [ ] **Step 1: Edit `vite.config.ts`**

Replace the current `build` block:

```typescript
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
  },
```

With:

```typescript
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
    minify: "esbuild",
  },
```

- [ ] **Step 2: Verify the splash UI still builds**

Run:
```bash
pnpm --filter desktop build:frontend
```
Expected: vite produces `apps/desktop/dist/index.html` and the script bundle.

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/vite.config.ts
git commit -m "build(desktop): make vite minify explicit"
```

---

## Task 10: Full end-to-end build and manual verification

This is the gate before we declare the optimization done.

**Files:**
- No code changes — verification only.

- [ ] **Step 1: Re-run staging and tests from a clean slate**

Run:
```bash
pnpm --filter desktop test
pnpm --filter desktop sidecar
pnpm --filter desktop smoke
```
All three must pass.

- [ ] **Step 2: Build the full Tauri app**

Run:
```bash
pnpm --filter desktop tauri build
```
Expected: produces `apps/desktop/src-tauri/target/release/bundle/macos/mLabs.app` and `apps/desktop/src-tauri/target/release/bundle/dmg/mLabs_0.1.0_aarch64.dmg`.

This will take 5-15 minutes on first release build (LTO is slow).

- [ ] **Step 3: Record final artifact sizes**

Run:
```bash
du -sh apps/desktop/src-tauri/target/release/bundle/macos/mLabs.app
du -sh apps/desktop/src-tauri/target/release/bundle/dmg/*.dmg
du -sh apps/desktop/src-tauri/bin
du -sh apps/desktop/src-tauri/resources
```

Compare against the baseline recorded in Task 0. Success criterion: `.app` size ≥ 50% smaller than baseline `bin + resources` total.

- [ ] **Step 4: Manual launch test**

Run:
```bash
open apps/desktop/src-tauri/target/release/bundle/macos/mLabs.app
```
(Right-click → Open the first time if Gatekeeper complains about unsigned binary.)

Verify:
1. Splash appears within 1s.
2. Within ~2s, the splash redirects to the actual web UI.
3. Onboarding flow works: create a profile.
4. Create an account.
5. Create a transaction.
6. Quit (Cmd+Q).
7. Re-open. Profile, account, transaction are all still there (libsql wrote to `~/Library/Application Support/app.mlabs.desktop/mlabs.db` and the next launch read them back).

If any step fails, capture the failure (Console.app for stderr, or check `~/Library/Logs/`) and stop — do not declare the task complete.

- [ ] **Step 5: Append final metrics to the plan doc**

Append to `docs/superpowers/plans/2026-05-09-desktop-build-optimization.md`:

```markdown
## Final metrics (recorded YYYY-MM-DD)

- `.app` bundle: <size> (baseline: <baseline>, reduction: <pct>)
- `.dmg`: <size>
- `src-tauri/bin/`: <size> (baseline: <baseline>)
- `src-tauri/resources/`: <size> (baseline: <baseline>)
- Cold start (double-click → web UI visible): <seconds>s

**Outcome:** [pass / fail per success criteria]
```

- [ ] **Step 6: Final commit**

```bash
git add docs/superpowers/plans/2026-05-09-desktop-build-optimization.md
git commit -m "docs(desktop): record final metrics post-bun-migration"
```

---

## Rollback

If something breaks unrecoverably, the entire change set is contained on this branch. Revert the commits in reverse order:

```bash
git log --oneline | head -15   # find the commits
git revert <commit>            # one at a time, in reverse order
```

The pre-change behavior (Node sidecar + esbuild bundle + walked node_modules) is fully preserved as commit history.

---

## Out of Plan Scope

Per the spec, these are explicitly NOT in this plan:
- Code signing or notarization
- Intel / universal binaries
- iOS build
- pnpm → Bun migration for the rest of the monorepo (separate spec/plan)
- API rewrite to Rust

---

## Baseline (recorded 2026-05-09)

- `src-tauri/bin/`: 112M
- `src-tauri/resources/`: 71M
- `src-tauri/resources/node_modules/`: 69M
- `src-tauri/resources/api/index.js`: 118K

## Final metrics (recorded 2026-05-09)

| Artifact | Final | Baseline | Reduction |
|---|---|---|---|
| `mLabs.app` (total) | **77MB** | ~183MB (bin + resources combined) | **~58%** |
| `mLabs_0.1.0_aarch64.dmg` | **29MB** | n/a (no prior dmg) | — |
| `.app/Contents/MacOS/` (Rust binary + Bun sidecar + libs) | 67MB | 112MB (Node binary copy) | ~40% |
| `.app/Contents/Resources/` (libsql native + migrations + web) | 9.7MB | 71MB (full dep tree) | ~86% |
| Rust release binary (`target/release/mlabs`) | 5.6MB (LTO+stripped) | n/a | — |

**Cold start:** double-click → `/api/health` returns 200 in **~1.15s** on M-series Mac (target: ≤2s) ✅

**Outcome: PASS** on all four success criteria:
1. ✅ `.app` size reduced by ≥ 50% (achieved: ~58%)
2. ✅ Cold start ≤ 2s (achieved: 1.15s)
3. ✅ All existing tests pass (13/13); extended smoke test passes (`/api/health` + `/api/bootstrap`)
4. ✅ `pnpm dev` continues to work (drizzle still imports `@libsql/client` normally)

### Notable implementation deviation

The original spec proposed marking `@libsql/client`, `libsql`, and `@libsql/darwin-arm64` all `--external` and resolving via `NODE_PATH`. During Task 6 (smoke test wiring) we discovered Bun's compiled-binary virtual FS (`/$bunfs/root/`) does not honor `NODE_PATH` for packages with conditional exports the way `bun run` does. We bundled the pure-JS libsql wrappers into the binary and kept only the `.node` native addon external. The spec has been updated to reflect this. Net effect: smaller staged tree (~8MB instead of ~12MB), one fewer moving part.

### Pre-existing icon issue (resolved)

The first `tauri build` failed at the `.app` bundling step because `apps/desktop/src-tauri/icons/icon.png` was a 1×1-pixel placeholder from the original v2 scaffold (commit `f750b0b`). Generated a proper 2048×2048 placeholder via Swift+AppKit and ran `tauri icon` to produce the full Apple icon set. This is unrelated to the build optimization but was needed to complete end-to-end verification.
