# mLabs macOS Desktop Installer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an unsigned macOS DMG that installs `mLabs.app`, launches a local API on `127.0.0.1:3001`, and runs fully offline with SQLite stored in app support directory.

**Architecture:** Add a new `apps/desktop` Tauri app that manages API lifecycle as a sidecar and opens a single desktop window at `http://127.0.0.1:3001`. Build `apps/web` static assets and package a production API sidecar binary; inject runtime env from Tauri so DB path is app-local and writable. Add smoke/integration tests for startup, shutdown, and fixed-port conflict behavior.

**Tech Stack:** Tauri (Rust + JS), Node 20+, Hono API, Vite React frontend, SQLite, PNPM workspace, Turbo.

---

## File Structure

- `apps/desktop/package.json`  
  New workspace package for desktop build/dev commands.
- `apps/desktop/src/main.ts`  
  Desktop frontend bootstrap; healthcheck polling and startup error UI.
- `apps/desktop/src/boot/healthcheck.ts`  
  Reusable polling helper for `/api/health`.
- `apps/desktop/src/boot/errors.ts`  
  Normalized startup/runtime error mapping shown in desktop UI.
- `apps/desktop/src-tauri/Cargo.toml`  
  Rust crate definition for Tauri binary.
- `apps/desktop/src-tauri/tauri.conf.json`  
  Bundling config (app metadata, dmg target, sidecar resource config).
- `apps/desktop/src-tauri/src/main.rs`  
  Launch and supervise API sidecar; stop it on app exit.
- `apps/desktop/src-tauri/src/sidecar.rs`  
  Sidecar startup/shutdown logic and env injection.
- `apps/desktop/src-tauri/src/errors.rs`  
  Rust error types surfaced to frontend.
- `apps/desktop/scripts/build-sidecar.mjs`  
  Build pipeline for API sidecar artifact consumed by Tauri.
- `apps/desktop/scripts/check-port.mjs`  
  Preflight check for fixed port 3001 conflict.
- `apps/api/src/libs/env.ts`  
  Add `HOST` support and enforce desktop-safe defaults.
- `apps/api/src/index.ts`  
  Bind to `127.0.0.1` in desktop mode and keep graceful shutdown behavior.
- `apps/api/src/libs/env.test.ts`  
  Tests for host/port validation and desktop-safe defaults.
- `apps/desktop/tests/desktop-smoke.test.mjs`  
  Integration smoke for startup health and shutdown behavior.
- `apps/desktop/tests/port-conflict.test.mjs`  
  Integration test for deterministic fixed-port conflict failure path.
- `package.json`  
  Add root scripts for `desktop:dev`, `desktop:build`, `desktop:test`.
- `turbo.json`  
  Ensure desktop build/test tasks are included in pipeline.
- `README.md`  
  Add macOS desktop install/run/build instructions.

### Task 1: Add Desktop-Safe API Bind Configuration

**Files:**
- Modify: `apps/api/src/libs/env.ts`
- Modify: `apps/api/src/index.ts`
- Modify: `packages/types/src/env.ts`
- Test: `apps/api/src/libs/env.test.ts`
- Modify: `apps/api/package.json`

- [ ] **Step 1: Write the failing env validation test**

```ts
// apps/api/src/libs/env.test.ts
import { describe, expect, it } from "vitest";
import { ApiEnvSchema } from "@workspace/types";

describe("ApiEnvSchema desktop safety", () => {
  it("accepts localhost-only host and fixed numeric port", () => {
    const result = ApiEnvSchema.safeParse({
      DATABASE_URL: "./data/mlabs.db",
      PORT: "3001",
      HOST: "127.0.0.1",
      NODE_ENV: "production",
      LOG_LEVEL: "info",
      CORS_ORIGIN: "http://127.0.0.1:3001",
    });

    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter api exec vitest run src/libs/env.test.ts`  
Expected: FAIL with schema mismatch because `HOST` is not yet in the schema.

- [ ] **Step 3: Implement minimal env/schema changes**

```ts
// packages/types/src/env.ts (additions)
export const ApiEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("127.0.0.1"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});
```

```ts
// apps/api/src/index.ts (serve config)
const port = env.PORT;
const host = env.HOST;

const server = serve(
  {
    fetch: app.fetch,
    port,
    hostname: host,
  },
  (info) => {
    logger.info(`Server is running on http://${host}:${info.port}/api`);
  }
);
```

```json
// apps/api/package.json (devDependency + script)
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter api test`  
Expected: PASS for `env.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add packages/types/src/env.ts apps/api/src/libs/env.ts apps/api/src/index.ts apps/api/src/libs/env.test.ts apps/api/package.json
git commit -m "feat(api): enforce localhost-safe host configuration for desktop mode"
```

### Task 2: Scaffold Desktop App Package and Tauri Runtime

**Files:**
- Create: `apps/desktop/package.json`
- Create: `apps/desktop/src/main.ts`
- Create: `apps/desktop/src/boot/healthcheck.ts`
- Create: `apps/desktop/src/boot/errors.ts`
- Create: `apps/desktop/src-tauri/Cargo.toml`
- Create: `apps/desktop/src-tauri/tauri.conf.json`
- Create: `apps/desktop/src-tauri/src/main.rs`
- Create: `apps/desktop/src-tauri/src/sidecar.rs`
- Create: `apps/desktop/src-tauri/src/errors.rs`

- [ ] **Step 1: Write the failing desktop healthcheck test**

```ts
// apps/desktop/src/boot/healthcheck.test.ts
import { describe, expect, it, vi } from "vitest";
import { waitForHealth } from "./healthcheck";

describe("waitForHealth", () => {
  it("throws after timeout when API is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(waitForHealth("http://127.0.0.1:3001", 2, 10)).rejects.toThrow(
      "API did not become healthy in time"
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter desktop exec vitest run src/boot/healthcheck.test.ts`  
Expected: FAIL because desktop package/test setup and `waitForHealth` do not exist.

- [ ] **Step 3: Implement minimal desktop scaffold**

```json
// apps/desktop/package.json
{
  "name": "desktop",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tauri dev",
    "build": "tauri build",
    "test": "vitest run"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "typescript": "^5.9.3",
    "vitest": "^3.2.0"
  }
}
```

```ts
// apps/desktop/src/boot/healthcheck.ts
export async function waitForHealth(baseUrl: string, retries = 60, delayMs = 250) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error("API did not become healthy in time");
}
```

```rust
// apps/desktop/src-tauri/src/main.rs
mod errors;
mod sidecar;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            sidecar::start_api_sidecar(app.handle())?;
            Ok(())
        })
        .on_window_event(|event| {
            if let tauri::WindowEvent::Destroyed = event.event() {
                let _ = sidecar::stop_api_sidecar();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter desktop test`  
Expected: PASS for healthcheck retry/timeout test.

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/package.json apps/desktop/src apps/desktop/src-tauri
git commit -m "feat(desktop): scaffold tauri app and healthcheck bootstrap"
```

### Task 3: Build and Bundle API Sidecar for Desktop

**Files:**
- Create: `apps/desktop/scripts/build-sidecar.mjs`
- Create: `apps/desktop/scripts/check-port.mjs`
- Modify: `apps/desktop/package.json`
- Modify: `apps/desktop/src-tauri/tauri.conf.json`
- Modify: `package.json`

- [ ] **Step 1: Write failing sidecar artifact test**

```ts
// apps/desktop/tests/sidecar-build.test.mjs
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";

describe("sidecar build", () => {
  it("produces macOS sidecar binary at expected path", () => {
    expect(existsSync("src-tauri/bin/mlabs-api-aarch64-apple-darwin")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter desktop exec vitest run tests/sidecar-build.test.mjs`  
Expected: FAIL because sidecar build output path does not exist.

- [ ] **Step 3: Implement sidecar build/bundle scripts**

```js
// apps/desktop/scripts/build-sidecar.mjs
import { execSync } from "node:child_process";

execSync("pnpm --filter web build", { stdio: "inherit" });
execSync("pnpm --filter api build", { stdio: "inherit" });
execSync(
  "pnpm --filter api exec pkg dist/index.js --targets node20-macos-arm64 --output ../desktop/src-tauri/bin/mlabs-api-aarch64-apple-darwin",
  { stdio: "inherit", cwd: "apps/api" }
);
```

```json
// apps/desktop/src-tauri/tauri.conf.json (sidecar excerpt)
{
  "bundle": {
    "active": true,
    "targets": ["dmg"],
    "externalBin": ["bin/mlabs-api"]
  }
}
```

```json
// package.json (root scripts excerpt)
{
  "scripts": {
    "desktop:sidecar": "pnpm --filter desktop sidecar:build",
    "desktop:dev": "pnpm --filter desktop dev",
    "desktop:build": "pnpm --filter desktop build",
    "desktop:test": "pnpm --filter desktop test"
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm desktop:sidecar && pnpm --filter desktop exec vitest run tests/sidecar-build.test.mjs`  
Expected: PASS and sidecar binary exists at `apps/desktop/src-tauri/bin/`.

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/scripts apps/desktop/src-tauri/tauri.conf.json apps/desktop/package.json package.json
git commit -m "feat(desktop): add sidecar build pipeline and bundle config"
```

### Task 4: Implement Fixed Port, App-Local DB Path, and Startup Error UX

**Files:**
- Modify: `apps/desktop/src-tauri/src/sidecar.rs`
- Modify: `apps/desktop/src/main.ts`
- Modify: `apps/desktop/src/boot/errors.ts`
- Test: `apps/desktop/tests/port-conflict.test.mjs`
- Test: `apps/desktop/tests/desktop-smoke.test.mjs`

- [ ] **Step 1: Write failing port-conflict integration test**

```js
// apps/desktop/tests/port-conflict.test.mjs
import { describe, expect, it } from "vitest";
import net from "node:net";
import { spawn } from "node:child_process";

describe("fixed port conflict", () => {
  it("fails fast when 3001 is already occupied", async () => {
    const blocker = net.createServer().listen(3001, "127.0.0.1");
    const proc = spawn("pnpm", ["--filter", "desktop", "dev"], { stdio: "pipe" });
    const output = [];
    proc.stderr.on("data", (d) => output.push(d.toString()));
    await new Promise((r) => setTimeout(r, 5000));
    blocker.close();
    proc.kill("SIGTERM");
    expect(output.join("")).toContain("PORT_3001_IN_USE");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter desktop exec vitest run tests/port-conflict.test.mjs`  
Expected: FAIL because sidecar currently has no explicit port-conflict code.

- [ ] **Step 3: Implement sidecar env + conflict error mapping**

```rust
// apps/desktop/src-tauri/src/sidecar.rs (excerpt)
let db_path = app.path().app_data_dir()?.join("mlabs.db");
let mut cmd = tauri::api::process::Command::new_sidecar("mlabs-api")?;
cmd = cmd
    .env("NODE_ENV", "production")
    .env("HOST", "127.0.0.1")
    .env("PORT", "3001")
    .env("DATABASE_URL", db_path.to_string_lossy().to_string())
    .env("CORS_ORIGIN", "http://127.0.0.1:3001");
```

```ts
// apps/desktop/src/boot/errors.ts
export function mapStartupError(err: unknown): string {
  const message = String(err ?? "");
  if (message.includes("address already in use")) return "PORT_3001_IN_USE";
  if (message.includes("EACCES")) return "DB_PATH_NOT_WRITABLE";
  return "API_START_FAILED";
}
```

```ts
// apps/desktop/src/main.ts (startup excerpt)
try {
  await waitForHealth("http://127.0.0.1:3001");
  window.location.replace("http://127.0.0.1:3001");
} catch (err) {
  document.body.innerHTML = `<pre>${mapStartupError(err)}</pre>`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter desktop exec vitest run tests/port-conflict.test.mjs tests/desktop-smoke.test.mjs`  
Expected: PASS; conflict surfaces deterministic error code and smoke test confirms health URL is reachable.

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src-tauri/src/sidecar.rs apps/desktop/src/main.ts apps/desktop/src/boot/errors.ts apps/desktop/tests
git commit -m "feat(desktop): enforce fixed localhost runtime and startup diagnostics"
```

### Task 5: Add Build Pipeline Integration, Docs, and Release Verification

**Files:**
- Modify: `turbo.json`
- Modify: `README.md`
- Create: `apps/desktop/tests/shutdown-smoke.test.mjs`
- Modify: `apps/desktop/package.json`

- [ ] **Step 1: Write failing shutdown smoke test**

```js
// apps/desktop/tests/shutdown-smoke.test.mjs
import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";

describe("desktop shutdown", () => {
  it("does not leave API process running after app exit", () => {
    execSync("pkill -f mlabs-api || true");
    execSync("pnpm --filter desktop dev -- --headless-test-exit-after-boot", {
      stdio: "inherit",
    });
    const ps = execSync("pgrep -f mlabs-api || true").toString().trim();
    expect(ps).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter desktop exec vitest run tests/shutdown-smoke.test.mjs`  
Expected: FAIL until launch/quit helper and cleanup wiring are complete.

- [ ] **Step 3: Implement pipeline/docs updates**

```json
// turbo.json (tasks excerpt)
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "dependsOn": ["^test"] }
  }
}
```

```md
<!-- README.md desktop excerpt -->
## macOS Desktop (offline, local-first)

```bash
pnpm desktop:sidecar
pnpm desktop:dev
```

Build unsigned DMG:

```bash
pnpm desktop:build
```

First launch on macOS may require `Right click -> Open` because v1 is unsigned.
```

```json
// apps/desktop/package.json (scripts excerpt)
{
  "scripts": {
    "sidecar:build": "node scripts/build-sidecar.mjs",
    "verify": "vitest run tests/*.test.mjs"
  }
}
```

- [ ] **Step 4: Run full verification**

Run: `pnpm lint && pnpm typecheck && pnpm desktop:test && pnpm desktop:build`  
Expected: all checks pass and DMG generated under `apps/desktop/src-tauri/target/release/bundle/dmg/`.

- [ ] **Step 5: Commit**

```bash
git add turbo.json README.md apps/desktop/package.json apps/desktop/tests
git commit -m "chore(desktop): integrate pipeline, docs, and release verification"
```

## Spec Coverage Check

- Tauri wrapper with desktop window only: covered by Tasks 2 and 4.
- Fixed localhost `127.0.0.1:3001`: covered by Tasks 1 and 4.
- Fully offline + local SQLite in app support dir: covered by Task 4.
- Unsigned DMG v1 packaging: covered by Tasks 3 and 5.
- Startup/shutdown reliability and port conflict behavior: covered by Tasks 2, 4, and 5.

## Placeholder/Consistency Check

- No unresolved markers are present.
- `HOST=127.0.0.1` and `PORT=3001` are consistent across all tasks.
- Error code `PORT_3001_IN_USE` is consistent between implementation and tests.
