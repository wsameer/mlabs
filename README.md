# shadcn/ui monorepo template

This is a Vite monorepo template with shadcn/ui.

## Local development (app + embedded SQLite)

Two separate workflows, depending on what you're working on:

### Web + API (most of the time)

```bash
cp .env.example .env
pnpm db:bootstrap        # or pnpm db:bootstrap:seed for sample data
pnpm dev                 # runs api (port 3001) + web (vite, port 5173)
```

Vite serves the frontend at `http://localhost:5173` and proxies `/api` to the Hono server on 3001. Edit files in `apps/web` or `apps/api` and both hot-reload.

### Desktop app (Tauri shell)

Running the desktop app is a separate command because it spawns a native window and a Rust toolchain:

```bash
pnpm desktop:sidecar     # stage API + web + node_modules into the Tauri resources dir
pnpm desktop:dev         # launch the Tauri dev window
```

See the [macOS Desktop](#macos-desktop-local-first-offline) section for prerequisites (Rust, Xcode CLT).

**Note:** `pnpm dev` intentionally excludes `apps/desktop` — use `pnpm desktop:dev` when you want the native window.

## PROD
```bash
# local testing (no domain, Caddy serves on localhost)
docker compose -f docker-compose.prod.yml up -d

# VPS/Droplet with a real domain
DOMAIN=mlabs.yourdomain.com docker compose -f docker-compose.prod.yml up -d

# Custom image tag or port
IMAGE_TAG=abc1234 HOST_PORT=8080 docker compose -f docker-compose.prod.yml up -d
```

## Self host
```bash
docker run -p 3001:3001 -v mlabs_data:/data ghcr.io/<your-username>/mlabs:latest
```

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

Spawns the staged Node sidecar on port 39099 with a temp `DATABASE_URL`, waits for `/api/health`, verifies the DB file is created, then sends SIGTERM. Used for quick validation that the sidecar artifacts are runnable without needing the Tauri GUI.

### What's shipped inside the DMG

- Tauri native shell (Rust)
- Node 22 runtime renamed as `mlabs-api-<triple>` (e.g., `mlabs-api-aarch64-apple-darwin`)
- `apps/api/dist/index.js` bundled via esbuild (with workspace packages inlined)
- `apps/web/dist/` (built Vite assets, served by the API at `/`)
- `packages/db/migrations/` (applied on first launch)
- `node_modules/@libsql/*` and other runtime deps

### Data location

The app stores its SQLite database at `~/Library/Application Support/app.mlabs.desktop/mlabs.db`. This path follows Tauri's identifier-based convention; the folder name matches the app identifier, not the `productName`. A future milestone may override the location to `~/Library/Application Support/mLabs/`.

### Schema changes

The desktop app applies **real migrations** from `packages/db/migrations/` on first launch, whereas the dev workflow uses `pnpm db:push` which writes the schema directly without producing a migration file. This means schema drift between `packages/db/src/schema.ts` and the committed migrations will only surface once the desktop installer runs — as a `SQLITE_ERROR` at runtime.

Safe workflow when changing `schema.ts`:

1. Edit `packages/db/src/schema.ts`.
2. Run `pnpm db:generate` — produces a new migration file under `packages/db/migrations/`.
3. Review the generated SQL. Drizzle occasionally emits SQL that SQLite rejects (e.g., parameter placeholders inside `CHECK` constraints) — fix by hand if needed.
4. Commit `schema.ts` and the new migration file together.
5. Re-run `pnpm desktop:sidecar` so the next DMG build picks up the new migration.

Don't share a single SQLite file between `pnpm dev` and the installed desktop app. Dev mode's `db:push` can silently diverge the file from what any migration history describes, which will confuse the desktop app's migrator on next launch. Treat them as separate databases (the desktop app lives in `~/Library/Application Support/app.mlabs.desktop/`; dev lives at `./data/mlabs.db`).

### Troubleshooting

- **"Port 3001 is already in use."** Quit whatever is bound to 3001 (`lsof -i tcp:3001`) and relaunch.
- **Splash stays on "Starting mLabs…" forever.** Check `Console.app` (under User Reports) for the Tauri app's stderr, or run `pnpm desktop:smoke` to verify the sidecar works outside the Tauri shell.
- **App won't open due to Gatekeeper.** Right-click → Open on first launch, or run `xattr -dr com.apple.quarantine /Applications/mLabs.app`.
