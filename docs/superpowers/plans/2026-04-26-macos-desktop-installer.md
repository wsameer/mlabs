# mLabs macOS Desktop Installer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an unsigned macOS DMG that installs `mLabs.app`, launches the existing Hono API as a Node sidecar bound to `127.0.0.1:3001`, serves the bundled web UI from the API, and stores SQLite in `~/Library/Application Support/mLabs/`.

**Architecture:** Add a new `apps/desktop` workspace containing a Tauri v2 shell. The Tauri app bundles three resources: (1) a minimal Vite-built splash UI that polls health then redirects to `http://127.0.0.1:3001`, (2) the API compiled with `tsc` plus `@libsql/*` node_modules staged alongside, (3) the web `dist/` assets. The sidecar is the Node runtime itself (renamed to the Tauri target triple) invoked with the bundled API entry file as its argument. Rust code supervises the child: port preflight on boot, env injection, graceful shutdown on window close.

**Tech Stack:** Tauri v2 (Rust), `tauri-plugin-shell` v2, `tauri-plugin-fs` v2, Node 22 (user must have `rustup` + Rust stable + Node 22 installed), Vite 7 (splash UI), Hono, `@libsql/client`, Drizzle, Vitest.

---

## Prerequisites (one-time, manual)

This plan assumes the developer machine has:
- Node 22.x (`node --version`)
- pnpm 9.x (`pnpm --version`)
- Xcode Command Line Tools (`xcode-select -p`)
- Rust stable via rustup (`rustc --version`)

If Rust is missing, install via `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` and restart the shell. The plan does not automate this; Task 8 documents it in the README.

---

## File Structure

- `apps/desktop/package.json` — workspace package (vite, vitest, `@tauri-apps/cli`)
- `apps/desktop/index.html` — splash page loaded by Tauri window at boot
- `apps/desktop/vite.config.ts` — Vite config (dev port 1420, build to `dist/`)
- `apps/desktop/tsconfig.json` — TS config extending workspace base
- `apps/desktop/src/main.ts` — splash entry: polls health, redirects or renders error
- `apps/desktop/src/boot/healthcheck.ts` — `waitForHealth` polling helper
- `apps/desktop/src/boot/healthcheck.test.ts` — vitest unit tests
- `apps/desktop/src/boot/errors.ts` — startup error code mapping + user-facing strings
- `apps/desktop/src/boot/errors.test.ts` — vitest unit tests
- `apps/desktop/src/splash.css` — spinner + error layout
- `apps/desktop/scripts/build-sidecar.mjs` — stages API bundle, web dist, @libsql deps, Node binary
- `apps/desktop/scripts/smoke-sidecar.mjs` — local smoke: spawn staged sidecar, hit `/api/health`
- `apps/desktop/src-tauri/Cargo.toml` — Rust crate manifest (Tauri v2 + plugins)
- `apps/desktop/src-tauri/build.rs` — standard Tauri build script
- `apps/desktop/src-tauri/tauri.conf.json` — app metadata, bundle/resources, DMG target
- `apps/desktop/src-tauri/capabilities/default.json` — v2 permissions (shell sidecar, fs app-local)
- `apps/desktop/src-tauri/src/main.rs` — Tauri entry: plugin wiring, setup, window events
- `apps/desktop/src-tauri/src/sidecar.rs` — port preflight, spawn Node sidecar with env, shutdown
- `apps/desktop/src-tauri/src/errors.rs` — Rust error types surfaced as strings to frontend
- `apps/desktop/src-tauri/icons/` — icon placeholders (README notes regenerate via `tauri icon`)
- `apps/desktop/tests/sidecar-bundle.test.mjs` — vitest: asserts staged bundle artifacts exist after build
- `apps/api/src/libs/env.ts` — already exists; no changes
- `apps/api/src/libs/env.test.ts` — new vitest file: schema accepts `HOST` + desktop-safe defaults
- `apps/api/src/libs/migrations.ts` — new: `applyMigrationsIfEnabled()` gated on env var
- `apps/api/src/libs/migrations.test.ts` — vitest: no-op when unset, runs migrate when set
- `apps/api/src/index.ts` — bind to `env.HOST`, await `applyMigrationsIfEnabled()` before serve
- `apps/api/package.json` — add `vitest` devDep + `test` script
- `apps/api/vitest.config.ts` — vitest config
- `packages/types/src/env.ts` — add `HOST` (default `127.0.0.1`) + `MIGRATIONS_FOLDER` (optional) + `WEB_DIST_PATH` (optional) to `ApiEnvSchema`
- `turbo.json` — add `test` task (cache outputs: none)
- `package.json` — root scripts: `desktop:dev`, `desktop:build`, `desktop:sidecar`, `desktop:smoke`, `test`
- `README.md` — macOS desktop install/run/build instructions + Rust/Node prereqs
- `.gitignore` — add `apps/desktop/src-tauri/target/`, `apps/desktop/src-tauri/gen/`, `apps/desktop/src-tauri/resources/`, `apps/desktop/src-tauri/bin/`, `apps/desktop/dist/`

---

### Task 1: Add localhost-safe API bind config + vitest setup

**Files:**
- Modify: `packages/types/src/env.ts`
- Modify: `apps/api/src/index.ts`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/src/libs/env.test.ts`
- Modify: `apps/api/package.json`

- [ ] **Step 1: Add vitest config**

Create `apps/api/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.test.ts"],
    watch: false,
  },
});
```

- [ ] **Step 2: Add vitest to api package + test script**

Edit `apps/api/package.json` to add `test` script and devDep. The final `scripts` and `devDependencies` sections must be:

```json
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "start:prod": "tsx src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

Add to `devDependencies`:

```json
    "vitest": "^3.2.4"
```

Then run: `pnpm install`

Expected: install succeeds; `pnpm --filter api exec vitest --version` prints a version.

- [ ] **Step 3: Write the failing env validation test**

Create `apps/api/src/libs/env.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ApiEnvSchema } from "@workspace/types";

describe("ApiEnvSchema", () => {
  it("defaults HOST to 127.0.0.1 when not provided", () => {
    const result = ApiEnvSchema.parse({
      DATABASE_URL: "./data/mlabs.db",
    });
    expect(result.HOST).toBe("127.0.0.1");
  });

  it("accepts explicit HOST, PORT, DATABASE_URL, and desktop env vars", () => {
    const result = ApiEnvSchema.safeParse({
      DATABASE_URL: "/Users/u/Library/Application Support/mLabs/mlabs.db",
      PORT: "3001",
      HOST: "127.0.0.1",
      NODE_ENV: "production",
      LOG_LEVEL: "info",
      CORS_ORIGIN: "http://127.0.0.1:3001",
      MIGRATIONS_FOLDER: "/Applications/mLabs.app/Contents/Resources/migrations",
      WEB_DIST_PATH: "/Applications/mLabs.app/Contents/Resources/web",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.HOST).toBe("127.0.0.1");
      expect(result.data.PORT).toBe(3001);
      expect(result.data.MIGRATIONS_FOLDER).toBe(
        "/Applications/mLabs.app/Contents/Resources/migrations"
      );
      expect(result.data.WEB_DIST_PATH).toBe(
        "/Applications/mLabs.app/Contents/Resources/web"
      );
    }
  });

  it("rejects an empty DATABASE_URL", () => {
    const result = ApiEnvSchema.safeParse({ DATABASE_URL: "" });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm --filter api test`

Expected: FAIL — `HOST`, `MIGRATIONS_FOLDER`, and `WEB_DIST_PATH` are not in the schema yet.

- [ ] **Step 5: Extend `ApiEnvSchema` with HOST + desktop env vars**

Edit `packages/types/src/env.ts`. Replace the `ApiEnvSchema` block with:

```ts
export const ApiEnvSchema = BaseEnvSchema.extend({
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().min(1).default("127.0.0.1"),
  DATABASE_URL: z.string().min(1).default("./data/mlabs.db"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  MIGRATIONS_FOLDER: z.string().optional(),
  WEB_DIST_PATH: z.string().optional(),
});
```

- [ ] **Step 6: Bind API to `env.HOST` in server startup**

Edit `apps/api/src/index.ts`. Replace the `// Server Startup` section through the `serve(...)` call (currently lines ~166–179) with:

```ts
// Server Startup
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
    logger.info(`Environment: ${env.NODE_ENV}`);
    logger.info(`Rate limiting: 100 requests per 15 minutes`);
  }
);
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `pnpm --filter api test`

Expected: PASS — 3 tests in `env.test.ts`.

Run: `pnpm --filter api exec tsc --noEmit`

Expected: no type errors.

- [ ] **Step 8: Commit**

```bash
git add packages/types/src/env.ts apps/api/src/libs/env.test.ts apps/api/src/index.ts apps/api/package.json apps/api/vitest.config.ts pnpm-lock.yaml
git commit -m "feat(api): add HOST binding and desktop env vars"
```

---

### Task 2: Auto-run migrations on boot (desktop-safe DB bootstrap)

**Files:**
- Create: `apps/api/src/libs/migrations.ts`
- Create: `apps/api/src/libs/migrations.test.ts`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/package.json`

Drizzle needs its `drizzle-orm/libsql/migrator` entry. It's already transitively available (via `drizzle-orm` in `@workspace/db`), but we'll add a direct devDep to keep resolution explicit.

- [ ] **Step 1: Write the failing migrations test**

Create `apps/api/src/libs/migrations.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter api test`

Expected: FAIL — `./migrations.ts` does not exist.

- [ ] **Step 3: Implement `applyMigrationsIfEnabled`**

Create `apps/api/src/libs/migrations.ts`:

```ts
import { existsSync, statSync } from "node:fs";
import { migrate } from "drizzle-orm/libsql/migrator";
import { getDb } from "./db.js";
import { logger } from "./logger.js";

export async function applyMigrationsIfEnabled(): Promise<void> {
  const folder = process.env.MIGRATIONS_FOLDER;
  if (!folder) {
    return;
  }
  if (!existsSync(folder) || !statSync(folder).isDirectory()) {
    throw new Error(
      `MIGRATIONS_FOLDER path does not exist or is not a directory: ${folder}`
    );
  }
  logger.info(`Applying migrations from ${folder}`);
  await migrate(getDb(), { migrationsFolder: folder });
  logger.info("Migrations applied");
}
```

- [ ] **Step 4: Wire `applyMigrationsIfEnabled` into API startup**

Edit `apps/api/src/index.ts`. At the top, add the import next to the other `./libs/` imports:

```ts
import { applyMigrationsIfEnabled } from "./libs/migrations.js";
```

Then, immediately before the `// Server Startup` section (currently line ~166), add:

```ts
// Apply migrations when desktop sidecar provides MIGRATIONS_FOLDER
await applyMigrationsIfEnabled();
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter api test`

Expected: PASS — all tests in `migrations.test.ts` and previously-passing `env.test.ts`.

Run: `pnpm --filter api exec tsc --noEmit`

Expected: no type errors.

Run: `PORT=3099 pnpm --filter api exec tsx src/index.ts` in one terminal, then `curl http://127.0.0.1:3099/api/health` in another.

Expected: health response with `"database":"connected"`; Ctrl-C to stop.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/libs/migrations.ts apps/api/src/libs/migrations.test.ts apps/api/src/index.ts
git commit -m "feat(api): apply drizzle migrations on boot when MIGRATIONS_FOLDER is set"
```

---

### Task 3: Scaffold desktop workspace (splash UI + Tauri v2 shell)

**Files:**
- Create: `apps/desktop/package.json`
- Create: `apps/desktop/tsconfig.json`
- Create: `apps/desktop/vite.config.ts`
- Create: `apps/desktop/index.html`
- Create: `apps/desktop/src/splash.css`
- Create: `apps/desktop/src/boot/healthcheck.ts`
- Create: `apps/desktop/src/boot/healthcheck.test.ts`
- Create: `apps/desktop/src/boot/errors.ts`
- Create: `apps/desktop/src/boot/errors.test.ts`
- Create: `apps/desktop/src/main.ts`
- Create: `apps/desktop/src-tauri/Cargo.toml`
- Create: `apps/desktop/src-tauri/build.rs`
- Create: `apps/desktop/src-tauri/tauri.conf.json`
- Create: `apps/desktop/src-tauri/capabilities/default.json`
- Create: `apps/desktop/src-tauri/src/main.rs`
- Create: `apps/desktop/src-tauri/src/errors.rs`
- Create: `apps/desktop/src-tauri/src/sidecar.rs` (minimal placeholder; fleshed out in Task 5)
- Create: `apps/desktop/src-tauri/icons/.gitkeep`
- Modify: `.gitignore`

- [ ] **Step 1: Create desktop package manifest**

Create `apps/desktop/package.json`:

```json
{
  "name": "desktop",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tauri dev",
    "build": "tauri build",
    "build:frontend": "vite build",
    "tauri": "tauri",
    "sidecar": "node scripts/build-sidecar.mjs",
    "smoke": "node scripts/smoke-sidecar.mjs",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.1.0",
    "@types/node": "^20.11.17",
    "@workspace/typescript-config": "workspace:*",
    "typescript": "5.9.3",
    "vite": "^7.2.4",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Create Vite + TS config**

Create `apps/desktop/tsconfig.json`:

```json
{
  "extends": "@workspace/typescript-config/nodejs.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noEmit": true,
    "types": ["vite/client", "node"],
    "verbatimModuleSyntax": false
  },
  "include": ["src/**/*.ts", "scripts/**/*.mjs"]
}
```

Create `apps/desktop/vite.config.ts`:

```ts
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
  },
});
```

- [ ] **Step 3: Create splash HTML + CSS**

Create `apps/desktop/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>mLabs</title>
    <link rel="stylesheet" href="/src/splash.css" />
  </head>
  <body>
    <main id="app" data-state="booting">
      <div class="spinner" aria-hidden="true"></div>
      <p class="status">Starting mLabs…</p>
      <pre class="error" hidden></pre>
    </main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Create `apps/desktop/src/splash.css`:

```css
html, body, main {
  margin: 0;
  height: 100%;
  background: #0b0b0f;
  color: #f4f4f5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  box-sizing: border-box;
  text-align: center;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #27272a;
  border-top-color: #a1a1aa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
main[data-state="error"] .spinner { display: none; }
main[data-state="error"] .status { color: #fca5a5; }
pre.error {
  max-width: 560px;
  white-space: pre-wrap;
  text-align: left;
  background: #18181b;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: #e4e4e7;
}
```

- [ ] **Step 4: Write failing unit test for healthcheck polling**

Create `apps/desktop/src/boot/healthcheck.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { waitForHealth } from "./healthcheck.js";

describe("waitForHealth", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves when fetch returns ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      waitForHealth("http://127.0.0.1:3001", { retries: 3, delayMs: 1 })
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries on thrown errors until success", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      waitForHealth("http://127.0.0.1:3001", { retries: 5, delayMs: 1 })
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws after exhausting retries", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      waitForHealth("http://127.0.0.1:3001", { retries: 3, delayMs: 1 })
    ).rejects.toThrow(/did not become healthy/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws when fetch returns non-OK after retries", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("nope", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      waitForHealth("http://127.0.0.1:3001", { retries: 2, delayMs: 1 })
    ).rejects.toThrow(/did not become healthy/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
```

Create a temporary empty `apps/desktop/src/boot/healthcheck.ts` so imports resolve:

```ts
export {};
```

- [ ] **Step 5: Install desktop package and run failing test**

Run: `pnpm install`

Then: `pnpm --filter desktop test`

Expected: FAIL — `waitForHealth` is not exported.

- [ ] **Step 6: Implement `waitForHealth`**

Replace `apps/desktop/src/boot/healthcheck.ts` with:

```ts
export interface WaitForHealthOptions {
  retries?: number;
  delayMs?: number;
  path?: string;
}

export async function waitForHealth(
  baseUrl: string,
  options: WaitForHealthOptions = {}
): Promise<void> {
  const retries = options.retries ?? 120;
  const delayMs = options.delayMs ?? 250;
  const path = options.path ?? "/api/health";

  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(`${baseUrl}${path}`);
      if (res.ok) {
        return;
      }
      lastError = new Error(`status ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    if (attempt < retries - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error(
    `API did not become healthy in time (${retries} attempts): ${String(lastError)}`
  );
}
```

- [ ] **Step 7: Verify healthcheck tests pass**

Run: `pnpm --filter desktop test`

Expected: PASS — 4 tests in `healthcheck.test.ts`.

- [ ] **Step 8: Write failing error-mapping test**

Create `apps/desktop/src/boot/errors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { mapStartupError, STARTUP_ERROR_MESSAGES } from "./errors.js";

describe("mapStartupError", () => {
  it("maps EADDRINUSE / address-in-use strings to PORT_3001_IN_USE", () => {
    expect(mapStartupError("listen EADDRINUSE: address already in use 127.0.0.1:3001")).toBe(
      "PORT_3001_IN_USE"
    );
    expect(mapStartupError(new Error("address already in use"))).toBe(
      "PORT_3001_IN_USE"
    );
  });

  it("maps EACCES / permission errors to DB_PATH_NOT_WRITABLE", () => {
    expect(mapStartupError("EACCES: permission denied, open '/Library/.../mlabs.db'")).toBe(
      "DB_PATH_NOT_WRITABLE"
    );
  });

  it("maps everything else to API_START_FAILED", () => {
    expect(mapStartupError(undefined)).toBe("API_START_FAILED");
    expect(mapStartupError("random failure")).toBe("API_START_FAILED");
  });

  it("exposes a user-facing message for every error code", () => {
    for (const code of ["PORT_3001_IN_USE", "DB_PATH_NOT_WRITABLE", "API_START_FAILED"] as const) {
      expect(STARTUP_ERROR_MESSAGES[code]).toMatch(/\S/);
    }
  });
});
```

- [ ] **Step 9: Run errors test to verify it fails**

Run: `pnpm --filter desktop test`

Expected: FAIL — `./errors.ts` does not exist.

- [ ] **Step 10: Implement error mapping**

Create `apps/desktop/src/boot/errors.ts`:

```ts
export type StartupErrorCode =
  | "PORT_3001_IN_USE"
  | "DB_PATH_NOT_WRITABLE"
  | "API_START_FAILED";

export const STARTUP_ERROR_MESSAGES: Record<StartupErrorCode, string> = {
  PORT_3001_IN_USE:
    "Port 3001 is already in use. Quit whatever is using it, then relaunch mLabs.",
  DB_PATH_NOT_WRITABLE:
    "mLabs could not write to its database file. Check that ~/Library/Application Support/mLabs is writable.",
  API_START_FAILED:
    "mLabs failed to start its local server. Try relaunching; if the problem persists, check the logs.",
};

export function mapStartupError(err: unknown): StartupErrorCode {
  const message = typeof err === "string" ? err : String((err as Error)?.message ?? err ?? "");
  const lower = message.toLowerCase();
  if (lower.includes("eaddrinuse") || lower.includes("address already in use")) {
    return "PORT_3001_IN_USE";
  }
  if (lower.includes("eacces") || lower.includes("permission denied")) {
    return "DB_PATH_NOT_WRITABLE";
  }
  return "API_START_FAILED";
}
```

- [ ] **Step 11: Verify error tests pass**

Run: `pnpm --filter desktop test`

Expected: PASS — all tests in `healthcheck.test.ts` and `errors.test.ts`.

- [ ] **Step 12: Implement splash entry (main.ts)**

Create `apps/desktop/src/main.ts`:

```ts
import { waitForHealth } from "./boot/healthcheck.js";
import { mapStartupError, STARTUP_ERROR_MESSAGES } from "./boot/errors.js";

const API_BASE = "http://127.0.0.1:3001";

function setError(code: string, detail: string): void {
  const root = document.getElementById("app");
  if (!root) return;
  root.dataset.state = "error";
  const status = root.querySelector<HTMLElement>(".status");
  if (status) status.textContent = STARTUP_ERROR_MESSAGES[code as keyof typeof STARTUP_ERROR_MESSAGES] ?? code;
  const pre = root.querySelector<HTMLElement>(".error");
  if (pre) {
    pre.hidden = false;
    pre.textContent = `${code}\n\n${detail}`;
  }
}

async function boot(): Promise<void> {
  try {
    await waitForHealth(API_BASE);
    window.location.replace(API_BASE);
  } catch (err) {
    const code = mapStartupError(err);
    setError(code, err instanceof Error ? err.message : String(err));
  }
}

void boot();
```

- [ ] **Step 13: Create Tauri v2 Rust crate skeleton**

Create `apps/desktop/src-tauri/Cargo.toml`:

```toml
[package]
name = "mlabs"
version = "0.1.0"
description = "mLabs desktop (local-first personal finance)"
authors = ["mLabs"]
edition = "2021"
rust-version = "1.77"

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-shell = "2"
tauri-plugin-fs = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "1"

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

Create `apps/desktop/src-tauri/build.rs`:

```rust
fn main() {
    tauri_build::build()
}
```

Create `apps/desktop/src-tauri/src/errors.rs`:

```rust
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum SidecarError {
    #[error("port {0} is already in use")]
    PortInUse(u16),
    #[error("failed to spawn sidecar: {0}")]
    Spawn(String),
    #[error("failed to resolve app data directory: {0}")]
    Path(String),
    #[error("io: {0}")]
    Io(#[from] std::io::Error),
    #[error("tauri: {0}")]
    Tauri(#[from] tauri::Error),
}

#[derive(Serialize)]
pub struct SerializedError {
    pub code: &'static str,
    pub message: String,
}

impl SidecarError {
    pub fn code(&self) -> &'static str {
        match self {
            SidecarError::PortInUse(_) => "PORT_3001_IN_USE",
            SidecarError::Path(_) => "DB_PATH_NOT_WRITABLE",
            _ => "API_START_FAILED",
        }
    }

    pub fn serialize(&self) -> SerializedError {
        SerializedError {
            code: self.code(),
            message: self.to_string(),
        }
    }
}
```

Create `apps/desktop/src-tauri/src/sidecar.rs` (minimal placeholder — full implementation arrives in Task 5):

```rust
use crate::errors::SidecarError;

pub const API_PORT: u16 = 3001;
pub const API_HOST: &str = "127.0.0.1";

pub fn preflight_port(port: u16) -> Result<(), SidecarError> {
    match std::net::TcpListener::bind(("127.0.0.1", port)) {
        Ok(listener) => {
            drop(listener);
            Ok(())
        }
        Err(_) => Err(SidecarError::PortInUse(port)),
    }
}
```

Create `apps/desktop/src-tauri/src/main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod errors;
mod sidecar;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|_app| {
            sidecar::preflight_port(sidecar::API_PORT)
                .map_err(|e| Box::<dyn std::error::Error>::from(e.to_string()))?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 14: Create Tauri config and capabilities**

Create `apps/desktop/src-tauri/tauri.conf.json`:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "mLabs",
  "version": "0.1.0",
  "identifier": "app.mlabs.desktop",
  "build": {
    "beforeDevCommand": "pnpm --filter desktop build:frontend",
    "beforeBuildCommand": "pnpm --filter desktop build:frontend",
    "devUrl": "http://localhost:1420",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "mLabs",
        "width": 1280,
        "height": 820,
        "minWidth": 960,
        "minHeight": 640,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": null,
      "capabilities": ["default"]
    }
  },
  "bundle": {
    "active": true,
    "targets": ["dmg", "app"],
    "icon": ["icons/icon.png"],
    "category": "Finance",
    "shortDescription": "Local-first personal finance",
    "longDescription": "mLabs runs entirely on your Mac. No cloud, no sync, no accounts.",
    "macOS": {
      "minimumSystemVersion": "11.0"
    },
    "resources": [],
    "externalBin": []
  }
}
```

The `capabilities: ["default"]` reference wires the file created in the next step. Tauri v2 allows in-window navigation to any HTTP URL by default (unlike v1's strict allowlist), so `window.location.replace("http://127.0.0.1:3001")` will work without additional config. The navigation happens inside the existing webview — the API's static serving takes over from there.

Create `apps/desktop/src-tauri/capabilities/default.json`:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "default capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:default",
    "fs:default"
  ]
}
```

- [ ] **Step 15: Gitignore Tauri + build outputs**

Edit `.gitignore` — append these lines at the end:

```
apps/desktop/dist/
apps/desktop/src-tauri/target/
apps/desktop/src-tauri/gen/
apps/desktop/src-tauri/bin/
apps/desktop/src-tauri/resources/
apps/desktop/src-tauri/icons/*
!apps/desktop/src-tauri/icons/.gitkeep
```

Create `apps/desktop/src-tauri/icons/.gitkeep` as an empty file.

- [ ] **Step 16: Generate placeholder icons**

First, check whether a brand icon exists anywhere at 1024×1024:

```bash
find packages/ui apps/web -name "*.png" -type f | xargs -I{} sh -c 'file "{}" | grep -q "1024 x 1024" && echo "{}"' 2>/dev/null | head -1
```

If that prints a path, use it. Otherwise create a stub using macOS-bundled `sips`:

```bash
# Generate a 1024x1024 solid-color PNG with no external dependencies
printf 'P3\n1 1\n255\n30 30 35\n' > /tmp/mlabs-icon.ppm
sips -s format png /tmp/mlabs-icon.ppm --out /tmp/mlabs-icon-1.png
sips -z 1024 1024 /tmp/mlabs-icon-1.png --out /tmp/mlabs-icon.png
```

Then generate the full icon set (run from repo root):

```bash
pnpm --filter desktop exec tauri icon /tmp/mlabs-icon.png
```

Expected: `apps/desktop/src-tauri/icons/` populated with `icon.icns`, `icon.png`, `32x32.png`, `128x128.png`, etc. Verify with `ls apps/desktop/src-tauri/icons/`.

- [ ] **Step 17: Verify typecheck + frontend build work**

Run: `pnpm --filter desktop typecheck && pnpm --filter desktop build:frontend`

Expected: typecheck passes; Vite produces `apps/desktop/dist/index.html` with hashed assets.

- [ ] **Step 18: Verify Rust crate compiles**

Run: `cd apps/desktop/src-tauri && cargo check`

Expected: `cargo check` succeeds (may download dependencies on first run). Return to repo root afterward.

- [ ] **Step 19: Commit**

```bash
git add apps/desktop .gitignore pnpm-lock.yaml
git commit -m "feat(desktop): scaffold tauri v2 shell and splash UI"
```

---

### Task 4: Build and stage desktop sidecar artifacts

**Files:**
- Create: `apps/desktop/scripts/build-sidecar.mjs`
- Create: `apps/desktop/scripts/smoke-sidecar.mjs`
- Create: `apps/desktop/tests/sidecar-bundle.test.mjs`
- Modify: `apps/desktop/package.json`
- Modify: `apps/desktop/src-tauri/tauri.conf.json`

The sidecar "binary" registered with Tauri is a copy of the Node runtime itself, renamed to `mlabs-api-aarch64-apple-darwin` (the current-host target triple). At runtime, Rust invokes it with the bundled API entry file as its first argument. The API entry, web dist, `@libsql/*` modules, and drizzle migrations are shipped as Tauri `resources`.

- [ ] **Step 1: Write failing artifact-existence test**

Create `apps/desktop/tests/sidecar-bundle.test.mjs`:

```js
import { describe, expect, it } from "vitest";
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
    const entries = readdirSync(bin).filter((f) =>
      f.startsWith("mlabs-api-") && !f.endsWith(".sig")
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter desktop exec vitest run tests/sidecar-bundle.test.mjs`

Expected: FAIL — bundle artifacts do not exist.

- [ ] **Step 3: Implement the staging script**

Create `apps/desktop/scripts/build-sidecar.mjs`:

```js
#!/usr/bin/env node
import { execSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
} from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(desktopRoot, "../..");
const tauri = path.join(desktopRoot, "src-tauri");
const resources = path.join(tauri, "resources");
const bin = path.join(tauri, "bin");

function run(cmd, cwd = repoRoot) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd });
}

function clean() {
  rmSync(resources, { recursive: true, force: true });
  rmSync(bin, { recursive: true, force: true });
  mkdirSync(resources, { recursive: true });
  mkdirSync(bin, { recursive: true });
}

function targetTriple() {
  const arch = process.arch; // "arm64" | "x64"
  const node = arch === "arm64" ? "aarch64" : "x86_64";
  return `${node}-apple-darwin`;
}

function stageNodeBinary() {
  const triple = targetTriple();
  const dest = path.join(bin, `mlabs-api-${triple}`);
  copyFileSync(process.execPath, dest);
  const stat = statSync(dest);
  if (stat.size < 5_000_000) {
    throw new Error(
      `Staged Node binary is suspiciously small (${stat.size} bytes); expected >5MB`
    );
  }
  // Ensure executable bit (copyFileSync preserves on macOS, but be explicit)
  execSync(`chmod +x "${dest}"`);
  console.log(`Staged Node sidecar: ${dest}`);
}

function stageApi() {
  run("pnpm --filter api build");
  const apiDist = path.join(repoRoot, "apps", "api", "dist");
  cpSync(apiDist, path.join(resources, "api"), { recursive: true });
}

function stageWeb() {
  run("pnpm --filter web build");
  const webDist = path.join(repoRoot, "apps", "web", "dist");
  cpSync(webDist, path.join(resources, "web"), { recursive: true });
}

function stageMigrations() {
  const src = path.join(repoRoot, "packages", "db", "migrations");
  if (!existsSync(src)) {
    throw new Error(`Migrations folder not found: ${src}`);
  }
  cpSync(src, path.join(resources, "migrations"), { recursive: true });
}

function stageNodeModules() {
  // Workspace layout: copy production deps needed at sidecar runtime.
  // We copy the whole api node_modules (pnpm hoists most into workspace root);
  // specifically we need @libsql/*, drizzle-orm, @workspace/*, hono, @hono/*,
  // zod, pino, dotenv, etc. Safest: resolve from the api package.
  const deps = [
    "@libsql",
    "@workspace",
    "drizzle-orm",
    "hono",
    "@hono",
    "zod",
    "pino",
    "pino-pretty",
    "sonic-boom",
    "fast-redact",
    "safe-stable-stringify",
    "on-exit-leak-free",
    "pino-abstract-transport",
    "pino-std-serializers",
    "process-warning",
    "thread-stream",
    "real-require",
    "quick-format-unescaped",
    "atomic-sleep",
    "dotenv",
    "hono-rate-limiter",
  ];
  const nmOut = path.join(resources, "node_modules");
  mkdirSync(nmOut, { recursive: true });
  for (const dep of deps) {
    const fromApi = path.join(repoRoot, "apps", "api", "node_modules", dep);
    const fromRoot = path.join(repoRoot, "node_modules", dep);
    const src = existsSync(fromApi) ? fromApi : fromRoot;
    if (!existsSync(src)) {
      console.warn(`warn: dep not found for staging: ${dep}`);
      continue;
    }
    cpSync(src, path.join(nmOut, dep), {
      recursive: true,
      dereference: true, // follow pnpm symlinks
    });
  }
}

function main() {
  console.log("Staging mLabs desktop sidecar artifacts...");
  clean();
  stageApi();
  stageWeb();
  stageMigrations();
  stageNodeModules();
  stageNodeBinary();
  console.log("Done.");
}

main();
```

Create `apps/desktop/scripts/smoke-sidecar.mjs`:

```js
#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(__dirname, "..");
const tauri = path.join(desktopRoot, "src-tauri");
const resources = path.join(tauri, "resources");
const bin = path.join(tauri, "bin");

function targetTriple() {
  const arch = process.arch;
  const node = arch === "arm64" ? "aarch64" : "x86_64";
  return `${node}-apple-darwin`;
}

async function waitForHealth(url, retries = 80, delayMs = 250) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`health never ready at ${url}`);
}

async function main() {
  const sidecar = path.join(bin, `mlabs-api-${targetTriple()}`);
  const apiEntry = path.join(resources, "api", "index.js");
  const tmp = mkdtempSync(path.join(os.tmpdir(), "mlabs-smoke-"));
  const dbPath = path.join(tmp, "mlabs.db");
  const env = {
    ...process.env,
    NODE_ENV: "production",
    HOST: "127.0.0.1",
    PORT: "3099",
    DATABASE_URL: dbPath,
    CORS_ORIGIN: "http://127.0.0.1:3099",
    WEB_DIST_PATH: path.join(resources, "web"),
    MIGRATIONS_FOLDER: path.join(resources, "migrations"),
    NODE_PATH: path.join(resources, "node_modules"),
  };
  const child = spawn(sidecar, [apiEntry], {
    env,
    stdio: ["ignore", "inherit", "inherit"],
  });
  const cleanup = () => {
    child.kill("SIGTERM");
    rmSync(tmp, { recursive: true, force: true });
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  try {
    await waitForHealth("http://127.0.0.1:3099/api/health");
    const dbExists = readdirSync(tmp).includes("mlabs.db");
    if (!dbExists) throw new Error("DB file was not created");
    console.log("smoke: OK");
  } catch (err) {
    console.error("smoke: FAILED", err);
    cleanup();
    process.exit(1);
  }
  cleanup();
}

void main();
```

- [ ] **Step 4: Add sidecar registration to Tauri config**

Edit `apps/desktop/src-tauri/tauri.conf.json`. Update the `bundle` block so `resources` points at the staged tree and `externalBin` registers the sidecar:

```json
  "bundle": {
    "active": true,
    "targets": ["dmg", "app"],
    "icon": ["icons/icon.png"],
    "category": "Finance",
    "shortDescription": "Local-first personal finance",
    "longDescription": "mLabs runs entirely on your Mac. No cloud, no sync, no accounts.",
    "macOS": {
      "minimumSystemVersion": "11.0"
    },
    "resources": ["resources/**/*"],
    "externalBin": ["bin/mlabs-api"]
  }
```

- [ ] **Step 5: Build sidecar and re-run artifact test**

Run: `pnpm --filter desktop sidecar`

Expected: script completes with "Done." and prints each dep staged.

Run: `pnpm --filter desktop exec vitest run tests/sidecar-bundle.test.mjs`

Expected: PASS — both tests green.

- [ ] **Step 6: Smoke-test the staged bundle**

Run: `pnpm --filter desktop smoke`

Expected: prints `smoke: OK`. The health endpoint responds, the DB is created, the sidecar exits cleanly on SIGTERM.

If the smoke fails with `Cannot find module '@libsql/client'` or similar, the `deps` list in `build-sidecar.mjs` is incomplete — add the missing package name and re-run `pnpm --filter desktop sidecar`.

- [ ] **Step 7: Commit**

```bash
git add apps/desktop/scripts apps/desktop/tests apps/desktop/package.json apps/desktop/src-tauri/tauri.conf.json
git commit -m "feat(desktop): stage api/web/node-modules/node-binary as tauri sidecar"
```

---

### Task 5: Spawn sidecar with env injection + graceful shutdown (Rust)

**Files:**
- Modify: `apps/desktop/src-tauri/src/sidecar.rs`
- Modify: `apps/desktop/src-tauri/src/main.rs`

- [ ] **Step 1: Flesh out `sidecar.rs`**

Replace `apps/desktop/src-tauri/src/sidecar.rs` with:

```rust
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};

use tauri::{AppHandle, Manager};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

use crate::errors::SidecarError;

pub const API_PORT: u16 = 3001;
pub const API_HOST: &str = "127.0.0.1";

static CHILD: OnceLock<Mutex<Option<CommandChild>>> = OnceLock::new();

fn child_slot() -> &'static Mutex<Option<CommandChild>> {
    CHILD.get_or_init(|| Mutex::new(None))
}

pub fn preflight_port(port: u16) -> Result<(), SidecarError> {
    match std::net::TcpListener::bind(("127.0.0.1", port)) {
        Ok(listener) => {
            drop(listener);
            Ok(())
        }
        Err(_) => Err(SidecarError::PortInUse(port)),
    }
}

fn resolve_resource(app: &AppHandle, relative: &str) -> Result<PathBuf, SidecarError> {
    app.path()
        .resolve(relative, tauri::path::BaseDirectory::Resource)
        .map_err(|e| SidecarError::Path(e.to_string()))
}

fn resolve_app_data(app: &AppHandle) -> Result<PathBuf, SidecarError> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| SidecarError::Path(e.to_string()))?;
    std::fs::create_dir_all(&dir).map_err(SidecarError::from)?;
    Ok(dir)
}

pub fn start(app: &AppHandle) -> Result<(), SidecarError> {
    preflight_port(API_PORT)?;

    let app_data = resolve_app_data(app)?;
    let db_path = app_data.join("mlabs.db");
    let api_entry = resolve_resource(app, "resources/api/index.js")?;
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
        .args([api_entry.to_string_lossy().to_string()])
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

    *child_slot().lock().unwrap() = Some(child);

    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    eprintln!("[api:out] {}", String::from_utf8_lossy(&line));
                }
                CommandEvent::Stderr(line) => {
                    eprintln!("[api:err] {}", String::from_utf8_lossy(&line));
                }
                CommandEvent::Terminated(status) => {
                    eprintln!("[api] terminated: {:?}", status);
                    break;
                }
                _ => {}
            }
        }
    });

    Ok(())
}

pub fn stop() {
    if let Some(child) = child_slot().lock().unwrap().take() {
        let _ = child.kill();
    }
}
```

- [ ] **Step 2: Wire start/stop into `main.rs`**

Replace `apps/desktop/src-tauri/src/main.rs` with:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod errors;
mod sidecar;

use tauri::{Manager, RunEvent, WindowEvent};

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if let Err(err) = sidecar::start(&app.handle()) {
                eprintln!("failed to start sidecar: {err}");
                // Surface a blocking hint in stderr; the splash UI will show
                // the error once it fails to reach the health endpoint.
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::Destroyed = event {
                if window.label() == "main" {
                    sidecar::stop();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|_handle, event| {
        if let RunEvent::ExitRequested { .. } = event {
            sidecar::stop();
        }
    });
}
```

- [ ] **Step 3: Verify Rust compiles**

Run: `cd apps/desktop/src-tauri && cargo check`

Expected: successful compile; a few unused-import warnings are acceptable.

- [ ] **Step 4: End-to-end dev run**

Run: `pnpm --filter desktop sidecar && pnpm --filter desktop dev`

Expected: Tauri opens a native window; the splash briefly shows "Starting mLabs…"; the window then navigates to `http://127.0.0.1:3001` and the mLabs web UI renders. The DB file appears at `~/Library/Application Support/app.mlabs.desktop/mlabs.db` (or `mLabs/mlabs.db`, depending on Tauri's identifier resolution).

Close the window. Verify no `mlabs-api` process remains:

```bash
pgrep -fl mlabs-api || echo "no sidecar running"
```

Expected: "no sidecar running".

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src-tauri/src/sidecar.rs apps/desktop/src-tauri/src/main.rs
git commit -m "feat(desktop): spawn api sidecar with env injection and graceful shutdown"
```

---

### Task 6: Turbo pipeline integration + root scripts

**Files:**
- Modify: `turbo.json`
- Modify: `package.json`

- [ ] **Step 1: Add `test` task to Turbo**

Replace `turbo.json` with:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "format": {
      "dependsOn": ["^format"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

- [ ] **Step 2: Add root desktop scripts**

Edit `package.json`. Replace the `scripts` block so it includes these new entries (keep all existing scripts):

```json
    "test": "turbo run test",
    "desktop:dev": "pnpm --filter desktop dev",
    "desktop:build": "pnpm --filter desktop build",
    "desktop:sidecar": "pnpm --filter desktop sidecar",
    "desktop:smoke": "pnpm --filter desktop smoke",
    "desktop:test": "pnpm --filter desktop test"
```

Merge these into the existing `scripts` object — do not drop the existing `db:*`, `build`, `dev`, `lint`, etc.

- [ ] **Step 3: Verify the pipeline**

Run: `pnpm test`

Expected: Turbo runs `api` and `desktop` tests; both suites pass.

Run: `pnpm typecheck`

Expected: all packages typecheck (desktop has its own `typecheck` script via the per-package scripts; other packages already have it).

- [ ] **Step 4: Commit**

```bash
git add turbo.json package.json
git commit -m "chore(desktop): add turbo test task and root desktop scripts"
```

---

### Task 7: Build unsigned DMG + packaging verification

**Files:** none (pure verification). No commit unless fixes are needed.

- [ ] **Step 1: Rebuild sidecar cleanly**

Run: `pnpm --filter desktop sidecar`

Expected: resources and bin directories populated.

- [ ] **Step 2: Build the macOS bundle**

Run: `pnpm --filter desktop build`

Expected: Tauri builds the frontend, compiles the Rust binary in release mode, and produces:
- `apps/desktop/src-tauri/target/release/bundle/macos/mLabs.app`
- `apps/desktop/src-tauri/target/release/bundle/dmg/mLabs_0.1.0_<arch>.dmg`

- [ ] **Step 3: Verify the DMG**

Run: `open apps/desktop/src-tauri/target/release/bundle/dmg/mLabs_0.1.0_*.dmg`

In the mounted DMG window, drag `mLabs.app` to `/Applications` (or copy via `cp -R`). Right-click `mLabs.app` → Open (required because the build is unsigned). Confirm the Gatekeeper warning; the app launches.

Verify in the running app:
- Splash briefly appears, then the web UI loads.
- `ls "$HOME/Library/Application Support/app.mlabs.desktop/"` shows `mlabs.db` (path may be `mLabs/` depending on Tauri's identifier resolution — both are acceptable for v1).
- Turn off Wi-Fi and relaunch the app — it still works.
- Quit the app, then `pgrep -fl mlabs-api` returns nothing.

- [ ] **Step 4: Verify port conflict behavior**

With the app quit, occupy port 3001:

```bash
node -e "require('net').createServer().listen(3001, '127.0.0.1', () => console.log('blocking 3001; Ctrl-C when done'))"
```

In another terminal, launch the installed app (`open /Applications/mLabs.app`). Expected: the splash remains on-screen and transitions to an error state showing "Port 3001 is already in use. Quit whatever is using it, then relaunch mLabs." within a few seconds.

Stop the blocker with Ctrl-C. Quit mLabs and relaunch — it should now boot normally.

- [ ] **Step 5: No commit**

No code changes in this task unless the verifications surfaced issues. If they did, fix the underlying code in the relevant earlier task's files and commit with an appropriate message (e.g., `fix(desktop): <what>`).

---

### Task 8: Documentation + prerequisites

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add desktop section to README**

Open `README.md` and append a new top-level section at the end:

```md
## macOS Desktop (local-first, offline)

mLabs ships as an unsigned macOS app that bundles the Hono API as a Node sidecar. The app binds strictly to `127.0.0.1:3001` and stores its SQLite database in `~/Library/Application Support/` — no cloud sync, no background daemon.

### Prerequisites

- macOS 11 or newer
- Node 22.x (`node --version`)
- pnpm 9.x (`pnpm --version`)
- Xcode Command Line Tools: `xcode-select --install`
- Rust stable via rustup:
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  # restart your shell
  rustc --version
  ```

### Development

```bash
pnpm install
pnpm desktop:sidecar   # build API + web + stage resources + copy node binary
pnpm desktop:dev       # launch Tauri dev window
```

The splash polls `GET /api/health` and redirects to `http://127.0.0.1:3001` once the sidecar is healthy.

### Build an unsigned DMG

```bash
pnpm desktop:sidecar
pnpm desktop:build
```

Output: `apps/desktop/src-tauri/target/release/bundle/dmg/mLabs_<version>_<arch>.dmg`.

Because the build is unsigned, first launch on another machine requires **Right-click → Open** to pass Gatekeeper. Signing and notarization are deferred to the next milestone.

### Smoke test (no GUI)

```bash
pnpm desktop:sidecar
pnpm desktop:smoke
```

Spawns the staged Node sidecar with a temp `DATABASE_URL`, waits for `/api/health`, and verifies the DB file is created.

### What's shipped inside the DMG

- Tauri native shell (Rust)
- Node 22 runtime renamed as `mlabs-api-<triple>`
- `apps/api/dist/` (compiled Hono API)
- `apps/web/dist/` (built Vite assets, served by the API at `/`)
- `packages/db/migrations/` (applied on first launch)
- `node_modules/@libsql/*` and other runtime deps

### Troubleshooting

- **"Port 3001 is already in use."** Quit whatever is bound to 3001 (`lsof -i tcp:3001`) and relaunch.
- **Splash stays on "Starting mLabs…" forever.** Check `~/Library/Logs/` for Tauri logs, or run `pnpm desktop:smoke` to verify the sidecar works outside the app.
- **App won't open due to Gatekeeper.** Right-click → Open on first launch, or run `xattr -dr com.apple.quarantine /Applications/mLabs.app`.
```

- [ ] **Step 2: Sanity-check the README rendering**

Run: `head -40 README.md` and visually confirm the existing content above the new section is intact.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add macos desktop install, build, and troubleshooting"
```

---

## Spec Coverage Check

| Spec requirement | Covered by |
|---|---|
| Installs as macOS app via DMG | Task 3 (bundle config), Task 7 (verification) |
| Runs fully offline | Task 5 (env injection), Task 7 (airplane-mode test) |
| Hosts backend locally on `127.0.0.1`, fixed port 3001 | Task 1 (HOST schema), Task 5 (Rust env), `sidecar::API_PORT` |
| Local SQLite only | Task 5 (`DATABASE_URL = app_data_dir/mlabs.db`) |
| No cloud sync, no required internet | Architecture (API-only, unchanged) |
| No persistent background daemon after window close | Task 5 (`sidecar::stop()` on WindowEvent::Destroyed and ExitRequested) |
| Tauri wrapper around existing web+api stack | Tasks 3, 5 |
| Bundled backend sidecar | Task 4 (staging), Task 5 (spawn) |
| Bundled frontend static assets served by local backend | Task 4 (web stage), Task 5 (`WEB_DIST_PATH`), existing API static serving |
| Fixed local endpoint `http://127.0.0.1:3001` | Tasks 1, 5 |
| Local data storage in macOS app support directory | Task 5 (`app_data_dir`) |
| Unsigned personal/dev distribution as DMG | Tasks 3, 7 |
| Healthcheck gate before window loads real URL | Task 3 (splash main.ts + waitForHealth) |
| Tauri terminates sidecar on quit | Task 5 |
| API graceful shutdown on SIGTERM | Pre-existing in `apps/api/src/index.ts` |
| Port 3001 already in use → fail fast with clear message | Task 3 (mapStartupError), Task 5 (`preflight_port`), Task 7 (verification) |
| Localhost-only bind | Task 1 |
| Unsigned DMG accepted | Task 7 (Right-click → Open documented in Task 8) |
| App bundle read-only at runtime; DB writes outside `.app` | Task 5 (app_data_dir path) |
| DB migrations on first run | Task 2 |
| Startup error view (blocking) | Task 3 (splash error state) |

## Placeholder / Consistency Check

- No `TBD`, `TODO`, `fill in later`, or generic "add validation" steps.
- `HOST=127.0.0.1` consistent across Task 1 (schema), Task 5 (Rust const), splash (`API_BASE`).
- `PORT=3001` consistent across Task 1, Task 5, Task 7.
- Error codes `PORT_3001_IN_USE`, `DB_PATH_NOT_WRITABLE`, `API_START_FAILED` match between TypeScript (`errors.ts`), Rust (`SidecarError::code`), and tests.
- `waitForHealth` signature identical between implementation (Task 3 Step 6), its tests (Task 3 Step 4), and the smoke script (Task 4 Step 3).
- `MIGRATIONS_FOLDER`, `WEB_DIST_PATH`, `DATABASE_URL` — every env var passed from Rust (Task 5) is declared in `ApiEnvSchema` (Task 1) and consumed by either the static-serving block (existing code) or `applyMigrationsIfEnabled` (Task 2).
- `mlabs-api-<target-triple>` naming consistent: `build-sidecar.mjs` stages it, `tauri.conf.json` registers `bin/mlabs-api` (Tauri appends the triple), Rust `sidecar("mlabs-api")` resolves it.
