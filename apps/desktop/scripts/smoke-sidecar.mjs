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

async function waitForOk(
  url,
  { retries = 80, delayMs = 250, isChildAlive } = {}
) {
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
    const res = await waitForOk(
      `http://127.0.0.1:${SMOKE_PORT}/api/bootstrap`,
      {
        isChildAlive: () => childAlive,
        retries: 20,
      }
    );
    const body = await res.json();
    if (typeof body !== "object" || body === null) {
      throw new Error(
        `/api/bootstrap returned unexpected body: ${JSON.stringify(body)}`
      );
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
