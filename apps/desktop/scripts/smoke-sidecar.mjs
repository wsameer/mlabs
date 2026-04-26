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
    PORT: "39099",
    DATABASE_URL: dbPath,
    CORS_ORIGIN: "http://127.0.0.1:39099",
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
    await waitForHealth("http://127.0.0.1:39099/api/health");
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
