#!/usr/bin/env node
import { execSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
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
  execSync(`chmod +x "${dest}"`);
  console.log(`Staged Node sidecar: ${dest}`);
}

function resolveEsbuild() {
  // esbuild is pulled in transitively via vite; search the pnpm store and node_modules.
  const candidates = [
    path.join(repoRoot, "node_modules", ".bin", "esbuild"),
    path.join(repoRoot, "node_modules", "esbuild", "bin", "esbuild"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  const pnpmRoot = path.join(repoRoot, "node_modules", ".pnpm");
  if (existsSync(pnpmRoot)) {
    const entries = readdirSync(pnpmRoot).filter((d) => d.startsWith("esbuild@"));
    // Prefer the highest version available.
    entries.sort().reverse();
    for (const entry of entries) {
      const bin = path.join(pnpmRoot, entry, "node_modules", "esbuild", "bin", "esbuild");
      if (existsSync(bin)) return bin;
    }
  }
  throw new Error("Could not locate esbuild binary; install it or run `pnpm install`.");
}

function stageApi() {
  // The API's `tsc` build is not self-contained (workspace `@workspace/db`
  // package's `main` points at a `.ts` file, and strict type errors exist in
  // source today), and production runs via `tsx`. Bundle the API with esbuild
  // to produce a single runtime-ready `resources/api/index.js`, marking deps
  // shipped in `resources/node_modules` as external so they resolve at runtime.
  const esbuild = resolveEsbuild();
  const entry = path.join(repoRoot, "apps", "api", "src", "index.ts");
  const outFile = path.join(resources, "api", "index.js");
  mkdirSync(path.dirname(outFile), { recursive: true });
  const external = [
    "@libsql/client",
    "@libsql/*",
    "better-sqlite3",
    "drizzle-orm",
    "drizzle-orm/*",
    "hono",
    "hono/*",
    "@hono/*",
    "hono-rate-limiter",
    "zod",
    "pino",
    "pino-pretty",
    "dotenv",
  ];
  const externalFlags = external.map((e) => `--external:${e}`).join(" ");
  run(
    `"${esbuild}" "${entry}" --bundle --platform=node --format=esm --target=node20 --outfile="${outFile}" ${externalFlags}`
  );
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
      const candidate = path.join(
        pnpmRoot,
        entry,
        "node_modules",
        dep
      );
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

// Root-set of deps imported directly by the API entry (and the libsql native
// binding needed at runtime on macOS arm64). Transitive deps are discovered
// by walking package.json `dependencies` on each staged package.
const ROOT_DEPS = [
  "@libsql/client",
  "@libsql/darwin-arm64",
  "drizzle-orm",
  "hono",
  "@hono/node-server",
  "@hono/zod-openapi",
  "@hono/swagger-ui",
  "zod",
  "pino",
  "pino-pretty",
  "dotenv",
  "hono-rate-limiter",
];

function stageNodeModules() {
  const nmOut = path.join(resources, "node_modules");
  mkdirSync(nmOut, { recursive: true });

  const staged = new Set();
  const missing = new Set();
  const queue = [...ROOT_DEPS];

  while (queue.length > 0) {
    const dep = queue.shift();
    if (staged.has(dep) || missing.has(dep)) continue;

    const src = findDep(dep);
    if (!src) {
      // Optional platform-specific native bindings are fine to skip.
      if (dep.startsWith("@libsql/") && dep !== "@libsql/client") {
        missing.add(dep);
        continue;
      }
      console.warn(`warn: dep not found for staging: ${dep}`);
      missing.add(dep);
      continue;
    }

    const destDir = path.join(nmOut, dep);
    mkdirSync(path.dirname(destDir), { recursive: true });
    cpSync(src, destDir, { recursive: true, dereference: true });
    staged.add(dep);

    // Queue transitive runtime dependencies (not devDependencies).
    const pkgPath = path.join(src, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        const runtimeDeps = {
          ...(pkg.dependencies || {}),
          ...(pkg.optionalDependencies || {}),
          ...(pkg.peerDependencies || {}),
        };
        for (const name of Object.keys(runtimeDeps)) {
          if (!staged.has(name) && !missing.has(name)) queue.push(name);
        }
      } catch (err) {
        console.warn(`warn: could not parse ${pkgPath}: ${err.message}`);
      }
    }
  }

  console.log(
    `Staged ${staged.size} runtime deps (${missing.size} skipped/missing).`
  );
  if (missing.size > 0) {
    const optional = [...missing].filter((d) => d.startsWith("@libsql/"));
    const nonOptional = [...missing].filter((d) => !d.startsWith("@libsql/"));
    if (nonOptional.length > 0) {
      console.warn(
        `Missing non-optional deps (will be caught by smoke test if required): ${nonOptional.join(", ")}`
      );
    }
    if (optional.length > 0) {
      console.log(`Skipped optional native bindings: ${optional.join(", ")}`);
    }
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
