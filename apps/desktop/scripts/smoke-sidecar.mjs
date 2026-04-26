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

function targetTriple() {
  const arch = process.arch;
  const node = arch === "arm64" ? "aarch64" : "x86_64";
  return `${node}-apple-darwin`;
}

async function waitForHealth(url, { retries = 80, delayMs = 250, isChildAlive } = {}) {
  for (let i = 0; i < retries; i++) {
    if (isChildAlive && !isChildAlive()) {
      throw new Error("sidecar exited before health endpoint became ready");
    }
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

  if (!existsSync(sidecar)) {
    throw new Error(
      `Sidecar binary not found at ${sidecar}. Run 'pnpm --filter desktop sidecar' first.`
    );
  }
  if (!existsSync(apiEntry)) {
    throw new Error(
      `API entry not found at ${apiEntry}. Run 'pnpm --filter desktop sidecar' first.`
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
    NODE_PATH: path.join(resources, "node_modules"),
  };

  let childAlive = true;
  let spawnError = null;

  const child = spawn(sidecar, [apiEntry], {
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
    await waitForHealth(`http://127.0.0.1:${SMOKE_PORT}/api/health`, {
      isChildAlive: () => childAlive,
    });
    if (spawnError) throw spawnError;
    const dbExists = readdirSync(tmp).includes("mlabs.db");
    if (!dbExists) throw new Error("DB file was not created");
    console.log("smoke: OK");
  } finally {
    if (childAlive) child.kill("SIGTERM");
    rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("smoke: FAILED", err.message || err);
  process.exit(1);
});
