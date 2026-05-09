---
title: Desktop build optimization (macOS, Apple Silicon)
date: 2026-05-09
status: draft
scope: apps/desktop
related: docs/superpowers/specs/2026-04-24-macos-desktop-installer-design.md
---

# Desktop build optimization (macOS, Apple Silicon)

## Summary

Replace the Node.js sidecar runtime with a Bun single-file compiled binary. This shrinks the macOS `.app` bundle from ~150MB+ to ~60–70MB, removes the staged `node_modules` tree, and reduces cold-start cost. The Tauri shell architecture, splash UI, healthcheck loop, and graceful-shutdown semantics are unchanged.

This spec covers `apps/desktop` only. A separate spec will cover migrating the rest of the monorepo from pnpm to Bun.

## Goals

1. Reduce `.app` bundle size by at least 50%.
2. Reduce cold start (double-click → first paint of redirected webview) to ≤ 2s on a dev M-series Mac.
3. Reduce resident memory of the sidecar process compared to the Node sidecar.
4. Keep `pnpm dev` working unchanged for the dev loop.

## Non-goals

- Code signing / notarization. Out of scope; unsigned local builds only.
- Intel (x86_64) or universal binaries. Apple Silicon only.
- iOS or other platforms.
- Migrating the rest of the monorepo off pnpm. Tracked separately.
- Porting the API to Rust. Tracked separately, if ever.

## Current state (baseline)

The desktop app today:

- `src-tauri/bin/mlabs-api-aarch64-apple-darwin` — a copy of the host `node` executable (~50MB).
- `src-tauri/resources/api/index.js` — the Hono API bundled by esbuild with runtime deps marked `external`.
- `src-tauri/resources/node_modules/...` — runtime dependency tree walked from `apps/api/package.json` and pnpm's virtual store (~80–100MB).
- `src-tauri/resources/migrations/*` — drizzle migrations.
- `src-tauri/resources/web/*` — `vite build` output of `apps/web`.
- `src-tauri/Cargo.toml` — no `[profile.release]` section (defaults).
- `apps/desktop/vite.config.ts` — bare-bones, no chunking or minify configuration beyond defaults.

`scripts/build-sidecar.mjs` orchestrates the staging: copies the Node binary, esbuild-bundles the API, walks `dependencies`/`peerDependencies` to stage `node_modules`, copies migrations, builds and copies the web assets.

Rust spawns the sidecar with `NODE_PATH` pointing at the staged `node_modules` and the API entrypoint passed as the first arg.

## Target architecture

Same Tauri shell + sidecar architecture. Only the sidecar packaging changes.

```
src-tauri/
  bin/
    mlabs-api-aarch64-apple-darwin     # bun --compile output (~61MB; embeds Hono + drizzle + libsql JS wrappers)
  resources/
    node_modules/
      @libsql/darwin-arm64/index.node  # ~8MB native binding only — everything else is embedded in the binary
    migrations/                         # unchanged
    web/                                # unchanged
```

`resources/api/` is removed. `resources/node_modules/` shrinks from ~80–100MB to ~8MB because only the native `.node` binding is staged at runtime — everything else (hono, drizzle, pino, zod, *and* the pure-JS libsql wrappers) is embedded directly in the Bun binary.

### Why a tiny `node_modules` is still needed

The `.node` binding (`@libsql/darwin-arm64/index.node`) is a precompiled native shared object loaded via `process.dlopen()`. Native modules cannot be embedded in a Bun-compiled binary — they must exist on the filesystem at load time. Hence one external package, one staged file.

### Why the JS wrappers are embedded (not external)

The original design proposed marking `@libsql/client` and `libsql` external as well, expecting them to resolve via `NODE_PATH`. During implementation we found that Bun's compiled-binary virtual FS (`/$bunfs/root/`) doesn't honor `NODE_PATH` for packages with conditional exports the way `bun run` does. Bundling the JS wrappers into the binary sidesteps that issue entirely and is simpler.

## Component changes

### A. `apps/desktop/scripts/build-sidecar.mjs`

Rewritten and simplified. Removes ~150 lines.

New responsibilities, in order:

1. **`preflightBun()`** — verifies `bun` is on PATH and reports its version. Errors with an install hint if missing.
2. **`clean()`** — removes `src-tauri/resources` and `src-tauri/bin`, then re-creates them. Unchanged.
3. **`stageBunSidecar()`** — runs:
   ```
   bun build apps/api/src/index.ts \
     --compile \
     --target=bun-darwin-arm64 \
     --minify \
     --external @libsql/darwin-arm64 \
     --outfile src-tauri/bin/mlabs-api-aarch64-apple-darwin
   ```
   `chmod +x` the output. Verify it is non-empty and reasonably sized (>20MB). Only the native `.node` binding is external; all pure-JS packages (including `@libsql/client` and `libsql`) get bundled.
4. **`stageLibsqlModules()`** — stages just the `@libsql/darwin-arm64` package at `src-tauri/resources/node_modules/@libsql/darwin-arm64/`. Reuses `findDep` (kept from current script) to locate it, copies with `cpSync` (dereference: true). Verifies `index.node` exists and is >1MB.
5. **`stageWeb()`** — unchanged from today: `pnpm --filter web exec vite build`, then copy `apps/web/dist` → `src-tauri/resources/web`.
6. **`stageMigrations()`** — unchanged: copy `packages/db/migrations` → `src-tauri/resources/migrations`.

Removed: `stageApi`, `stageNodeBinary`, `resolveEsbuild`, the `ROOT_DEPS`-walking version of `stageNodeModules`, `targetTriple` (only one target now). `findDep` is kept and used by `stageLibsqlModules`.

### B. `packages/db/src/index.ts`

No source-level changes. `@libsql/client` and `libsql` are bundled into the Bun binary directly (per the "Why the JS wrappers are embedded" section above), so the import in `packages/db/src/index.ts` resolves at *bundle time*, not at runtime via `NODE_PATH`. At runtime, only the `.node` native binding is dlopen'd — `libsql` finds it via its own internal loader (`@neon-rs/load`), which walks up from `__dirname` until it finds `node_modules/@libsql/darwin-arm64/index.node`. `NODE_PATH` set by Rust ensures that walk hits the staged tree.

### C. `apps/desktop/src-tauri/src/sidecar.rs`

Small edits:

- Drop the `api_entry` positional arg passed to the sidecar (Bun-compiled binary needs no JS path).
- Drop the `resolve_resource(...)` call for `resources/api/index.js` (no longer staged).
- `NODE_PATH` env var stays, still pointing at `resources/node_modules` — but the staged tree is now ~12MB instead of ~100MB.

Everything else — `preflight_port`, `app_data_dir` resolution, healthcheck loop, SIGTERM-then-SIGKILL shutdown, error mapping — stays unchanged.

### D. `apps/desktop/src-tauri/Cargo.toml`

Add a release profile tuned for size and runtime cost:

```toml
[profile.release]
lto = "thin"
codegen-units = 1
strip = true
panic = "abort"
```

Trade-off: slower clean release builds (~30–60s extra) for a smaller, faster Rust binary. `target/` is cached locally, so incremental builds are unaffected.

### E. `apps/desktop/vite.config.ts`

Minor tuning. Today's config is already fine; we set explicit `minify: 'esbuild'` (default but explicit) and confirm `target: 'es2022'`. No code-splitting changes — the desktop UI is currently a single splash page.

### F. `apps/desktop/scripts/smoke-sidecar.mjs`

Extend the existing smoke test. Today it spawns the staged sidecar and pings `/api/health`. Add a follow-up call to a DB-touching endpoint (e.g. `GET /api/profiles`) so the libsql native binding is actually exercised before a build is declared green.

## Data flow (cold start)

```
User double-clicks mLabs.app
  → Tauri shell launches, shows splash (apps/desktop/src/main.ts)
  → Rust setup() calls sidecar::start()
      preflight_port(3001)
      resolve resources/web, resources/migrations, resources/node_modules
      spawn bin/mlabs-api with envs (no positional args):
        NODE_ENV=production
        HOST=127.0.0.1
        PORT=3001
        DATABASE_URL=<app_data>/mlabs.db
        CORS_ORIGIN=<origins>
        LOG_LEVEL=info
        WEB_DIST_PATH=<resources>/web
        MIGRATIONS_FOLDER=<resources>/migrations
        NODE_PATH=<resources>/node_modules   (now ~12MB libsql-only tree)
  → Bun binary starts: parses embedded JS, requires `@libsql/client`
    via NODE_PATH, dlopens libsql native binding, applies migrations,
    Hono server listens on 127.0.0.1:3001
  → Splash polls /api/health, redirects to API_BASE on success
```

## Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Bun has a runtime incompatibility with Hono/drizzle/libsql we don't catch until runtime. | Low — these libs are well-exercised on Bun. | Extend `smoke-sidecar.mjs` to hit a DB-touching route. Run it as a build gate. |
| Bun's loader can't resolve `@libsql/client` via NODE_PATH at runtime. | Low — Bun supports NODE_PATH like Node. | Smoke test exercises a DB-touching route end-to-end. |
| Bun's `process` / `Buffer` semantics differ from Node in a way that breaks pino, dotenv, or rate limiter. | Low. | Smoke test catches it. Fallback: switch to Node SEA in a follow-up; the Rust + staging architecture still works. |
| Bun is missing on the build machine. | Certain on a fresh checkout. | `preflightBun()` errors with a clear install hint at the top of the staging script. |
| `bun --compile` output is larger than estimated. | Low. | Acceptable up to ~80MB; if larger, profile with `bun build --analyze` and look for unexpected dep inclusions. |
| Cargo release-profile changes slow CI builds noticeably. | Medium for clean builds, low for incremental. | Accept the trade-off; CI is not part of this scope and local incremental builds are unaffected. |

## Testing

- **Existing unit tests** (`errors.test.ts`, `healthcheck.test.ts`) — must remain green.
- **Smoke test** (`scripts/smoke-sidecar.mjs`) — extended to call `/api/health` *and* a DB-touching route. Run as part of `pnpm sidecar` verification.
- **Manual verification:**
  1. `pnpm --filter desktop sidecar` produces the staged artifacts.
  2. `pnpm --filter desktop tauri build` produces a `.app` and `.dmg`.
  3. Double-click the `.app`. UI loads. Create a profile, an account, a transaction. Quit. Re-open. Data persists.
- **Size check:** record before/after sizes for `bin/`, `resources/`, the unpacked `.app`, and the `.dmg`.

## Success criteria

1. `.app` bundle size reduced by ≥ 50% (target ~60–70MB from current ~150MB+).
2. Cold-start time from double-click → first paint of the redirected webview ≤ 2s on the dev M-series Mac.
3. All existing tests pass; extended smoke test passes.
4. `pnpm dev` continues to work for the dev loop with no regression.

## Out of scope (deferred)

- pnpm → Bun migration for the rest of the monorepo (will get its own spec).
- Code signing and notarization.
- Intel / universal binaries.
- iOS build.
- API rewrite in Rust / sidecar elimination.

## Open questions

None at design time. Implementation may surface specifics around Bun's handling of `--external` for native modules; the smoke test is the gate.
