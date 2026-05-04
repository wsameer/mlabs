# mLabs macOS Desktop Installer Design (v1)

## Goal

Ship a macOS-installable desktop app for mLabs that behaves like Actual Budget in local mode:

- Installs as a macOS app via DMG.
- Runs fully offline.
- Hosts app backend locally on `127.0.0.1` with a fixed port.
- Uses local SQLite only.
- No cloud sync, no required internet access.
- App runs as a normal desktop window only (no persistent background daemon after window close).

## Scope

### In Scope (v1)

- Tauri-based macOS wrapper around existing web+api stack.
- Bundled backend sidecar process (Node/Hono API).
- Bundled frontend static assets served by local backend.
- Fixed local endpoint: `http://127.0.0.1:3001`.
- Local data storage in macOS app support directory.
- Unsigned personal/dev distribution as DMG.

### Out of Scope (v1)

- Apple code signing and notarization.
- Cloud accounts or sync.
- Multi-device sync.
- Auto-update service.
- Background/headless service mode.

## Current Project Context

Existing repo already supports a single-process production runtime:

- API (`apps/api`) serves `/api/*`.
- API can also serve built frontend static assets when `NODE_ENV=production`.
- SQLite is already used as embedded storage (`DATABASE_URL`).
- Production deploy currently runs as one container with persistent `/data`.

This reduces migration risk: desktop packaging can reuse current runtime model rather than redesigning application layers.

## Selected Approach

Use **Tauri + Node sidecar**:

- Keep current React/Vite frontend and Hono API.
- Build frontend assets and include them in desktop bundle.
- Package API as a sidecar process launched by Tauri at app startup.
- Tauri window loads `http://127.0.0.1:3001`.

Rationale:

- Minimal rewrite from current architecture.
- Smaller footprint than Electron.
- Native desktop packaging and window lifecycle control.
- Clean path to signed/notarized distribution later.

## Alternatives Considered

### Electron + embedded Node server

- Pros: mature ecosystem, broad examples.
- Cons: larger binaries and runtime cost; less aligned with lightweight local-first distribution.

### Browser-only local server launcher

- Pros: fastest initial ship.
- Cons: poor desktop install UX, not a true app experience.

## Architecture

### Runtime Components

- **Tauri shell**: native macOS app window lifecycle and packaging.
- **Node sidecar**: runs `apps/api` production server locally.
- **Web UI**: built from `apps/web`, served by API static serving.
- **SQLite DB**: stored in app-local writable directory.

### Startup Flow

1. User launches `mLabs.app`.
2. Tauri spawns API sidecar with production env.
3. Tauri polls `GET /api/health` on `127.0.0.1:3001`.
4. On healthy response, app window loads localhost URL.
5. On failure, app shows blocking startup error view.

### Shutdown Flow

1. User closes/quits app window.
2. Tauri terminates sidecar process gracefully.
3. API handles graceful shutdown and closes HTTP server.

No background runtime remains after quit.

## Configuration

### Fixed Runtime Settings

- Bind address: `127.0.0.1`
- Port: `3001` (fixed)
- Base URL: `http://127.0.0.1:3001`

### Sidecar Environment

- `NODE_ENV=production`
- `PORT=3001`
- `DATABASE_URL=<app-support-dir>/mlabs.db`
- `CORS_ORIGIN=http://127.0.0.1:3001`
- `WEB_DIST_PATH=<bundled-web-dist-path>`

## Data and File Locations

- Primary DB file in macOS app support path (for example `~/Library/Application Support/mLabs/mlabs.db`).
- Backups/exports also local-only in user-selected filesystem locations.
- App bundle remains read-only at runtime; no DB writes inside `.app`.

## Error Handling

### Startup Errors

Show explicit blocking screen with actionable diagnostics if:

- Port `3001` is already in use.
- Sidecar binary fails to execute.
- DB path is not writable.
- API healthcheck does not become ready within timeout.

### Runtime Errors

- If sidecar crashes, show reconnect/restart action.
- Persist logs locally for troubleshooting.

### Port Conflict Policy

Because port must be fixed, v1 behavior is fail-fast with clear message and retry option after user resolves conflict.

## Security Model (v1)

- Localhost-only bind (`127.0.0.1`, not `0.0.0.0`).
- No remote exposure by default.
- No cloud credentials required.
- Unsigned DMG accepted for personal/dev distribution.

## Packaging and Distribution

### Artifact

- Unsigned `.dmg` containing `mLabs.app`.

### Installation UX (personal/dev)

1. Open DMG.
2. Drag app to `/Applications`.
3. First launch may require `Right click -> Open` due to unsigned build.

## Build and Release Flow (v1)

1. Build web assets (`apps/web`).
2. Build/prepare API sidecar (`apps/api` production artifact).
3. Bundle assets + sidecar with Tauri.
4. Run `tauri build` for macOS target.
5. Publish unsigned DMG for dev/personal install.

## Test Strategy

### Required v1 Verification

- App launches and reaches ready state via `/api/health`.
- DB file is created in app support directory on first run.
- App works fully offline with network disabled.
- Port conflict on `3001` shows clear startup error.
- Quit closes sidecar (no lingering local server process).

### Recommended CI/Local Checks

- Smoke test packaged app on clean macOS user profile.
- Basic CRUD path validation for profiles/accounts/transactions.
- Export/backup writes to local filesystem.

## Risks and Mitigations

- **Risk:** Sidecar startup race causes blank UI.
  - **Mitigation:** explicit healthcheck gate before window navigation.
- **Risk:** Fixed port collision with other software.
  - **Mitigation:** clear diagnostic + retry; document reserved port behavior.
- **Risk:** Unsigned distribution friction.
  - **Mitigation:** include first-launch instructions; defer signing/notarization to next milestone.

## Future Milestones (Post-v1)

- Apple Developer signing + notarization.
- Auto-updates.
- Optional configurable port fallback (if product constraints change).
- Optional self-host and desktop release matrix from shared build outputs.

