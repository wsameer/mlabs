#!/usr/bin/env node
import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
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

function clean() {
  rmSync(resources, { recursive: true, force: true });
  rmSync(bin, { recursive: true, force: true });
  mkdirSync(resources, { recursive: true });
  mkdirSync(bin, { recursive: true });
}


function stageWeb() {
  // Use `vite build` directly rather than the workspace `build` script, which
  // also runs `tsc -b`. We already typecheck in CI; at sidecar-stage time we
  // only need the runtime output and don't want stale type errors to block
  // packaging of the desktop bundle.
  run("pnpm --filter web exec vite build");
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

function findDep(dep) {
  // pnpm scatters deps: direct deps live in each package's node_modules,
  // transitive deps live in node_modules/.pnpm/<name>@<ver>/node_modules/<name>.
  // Check direct-dep locations first, then fall back to the virtual store.
  const directCandidates = [
    path.join(repoRoot, "apps", "api", "node_modules", dep),
    path.join(repoRoot, "packages", "db", "node_modules", dep),
    path.join(repoRoot, "node_modules", dep),
  ];
  for (const c of directCandidates) {
    if (existsSync(c)) return c;
  }
  // Scan the pnpm virtual store. Pick the highest-version match.
  const pnpmRoot = path.join(repoRoot, "node_modules", ".pnpm");
  if (existsSync(pnpmRoot)) {
    const prefix = dep.startsWith("@")
      ? `${dep.replace("/", "+")}@`
      : `${dep}@`;
    const matches = readdirSync(pnpmRoot).filter((entry) =>
      entry.startsWith(prefix)
    );
    matches.sort().reverse();
    for (const entry of matches) {
      const candidate = path.join(pnpmRoot, entry, "node_modules", dep);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

function stageBunSidecar() {
  const triple = "aarch64-apple-darwin"; // arm64 macOS only per spec
  const dest = path.join(bin, `mlabs-api-${triple}`);
  const entry = path.join(repoRoot, "apps", "api", "src", "index.ts");
  // Bundle @libsql/client and libsql (pure JS) directly into the binary.
  // Only keep @libsql/darwin-arm64 external — it is a .node native addon that
  // cannot be embedded and must be loaded from the filesystem at runtime.
  const cmd = [
    "bun build",
    `"${entry}"`,
    "--compile",
    "--target=bun-darwin-arm64",
    "--minify",
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

function stageLibsqlModules() {
  const nmOut = path.join(resources, "node_modules");
  mkdirSync(nmOut, { recursive: true });
  // Only the native .node binding needs to be staged — all pure-JS packages
  // (@libsql/client, libsql, @neon-rs/load, detect-libc, etc.) are bundled
  // directly into the binary at compile time.
  const libsqlPkgs = ["@libsql/darwin-arm64"];
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

try {
  main();
} catch (err) {
  console.error("Sidecar staging failed:", err);
  process.exit(1);
}
