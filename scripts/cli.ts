#!/usr/bin/env node
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import os from "os";
import { select } from "@inquirer/prompts";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

// ── Constants & Metadata ────────────────────────────────────────

const DIM = chalk.gray;
const GREEN = chalk.greenBright;
const RED = chalk.red;
const CYAN = chalk.cyan;
const BRAND = chalk.hex("#8B94FF");

const MCP_NAME = "elseid-mcp";
const GITHUB_REPO = "9Churze/ElseID";

// Dynamically resolve package version
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findPackageJson(startDir: string): any {
  let curr = startDir;
  while (curr !== path.parse(curr).root) {
    const pkgPath = path.join(curr, "package.json");
    if (fs.existsSync(pkgPath)) {
      return { ...JSON.parse(fs.readFileSync(pkgPath, "utf8")), __path: pkgPath };
    }
    curr = path.dirname(curr);
  }
  return {};
}

const pkg = findPackageJson(__dirname);
const VERSION = pkg.version || "1.0.0";

// ── MCP Mode Detection ──────────────────────────────────────────

if (process.argv.includes("--stdio")) {
  const pkgData = findPackageJson(__dirname);
  const projectRoot = pkgData.__path ? path.dirname(pkgData.__path) : path.resolve(__dirname, "..");
  const serverPath = fs.existsSync(path.join(projectRoot, "dist/src/index.js"))
    ? path.join(projectRoot, "dist/src/index.js")
    : path.join(projectRoot, "src/index.js");
  const child = spawn("node", [serverPath, ...process.argv.slice(2)], { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code ?? 0));
} else {
  runCLI().catch((err) => {
    console.error(RED(`\n  Fatal error: ${err.message}`));
    process.exit(1);
  });
}

// ── Types ───────────────────────────────────────────────────────

import { getRegistry, type ClientDef, type ConfigFormat } from "./registry.js";

interface InjectResult {
  ok: boolean;
  status: "updated" | "skipped" | "error" | "unsupported";
  errorType?: string;
  message?: string;
  backupPath?: string;
}


// ── Utils ───────────────────────────────────────────────────────

function sanitisePath(p: string): string {
  return p.replace(os.homedir(), "~");
}

function escapeRegex(str: string): string {
  return str.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
}

async function detectClient(client: ClientDef): Promise<boolean> {
  if (client.unsupported) return false;
  try {
    const candidates = client.detectPaths
      ? client.detectPaths()
      : [path.dirname(client.configPath())];
    
    const validPaths = candidates.filter(Boolean);
    if (validPaths.length === 0) return false;

    for (const p of validPaths) {
      if (fs.existsSync(p)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function readJson(filePath: string): any | null {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`malformed-json: ${(err as Error).message}`);
  }
}

async function writeAtomic(filePath: string, content: string): Promise<void> {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  const tmp = filePath + ".tmp";
  await fsp.writeFile(tmp, content, "utf8");
  await fsp.rename(tmp, filePath);
}

function backupIfExists(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const bak = filePath + ".bak";
    fs.copyFileSync(filePath, bak);
    return bak;
  } catch {
    return null;
  }
}

// ── Idempotency & Merging ────────────────────────────────────────

function areEntriesEqual(a: any, b: any): boolean {
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

function getMcpEntry(client: ClientDef, cmd: string, args: string[]) {
  const entry: any = { command: cmd, args };
  
  if (client.format === "json-mcp-local") {
    // If it's a local development run, we use the passed cmd/args which point to local files.
    // If it's a remote run (npx), we can use the specific type: "local" structure.
    const isNpx = cmd === "npx";
    if (isNpx) {
      return { type: "local", command: ["npx", "-y", "elseid-mcp", "--stdio"], enabled: true };
    }
  }

  if (client.requiresStdioType) {
    entry.type = "stdio";
  }
  
  return entry;
}

function mergeTomlBlock(existing: string, cmd: string, args: string[]): { content: string; changed: boolean } {
  const escapedName = escapeRegex(MCP_NAME);
  const block =
    `[mcp_servers."${MCP_NAME}"]\n` +
    `command = "${cmd}"\n` +
    `args = [${args.map((a) => `"${a}"`).join(", ")}]`;

  // Matches the block and any trailing whitespace until the next block or end of file
  const pattern = new RegExp(
    `\\[mcp_servers\\."${escapedName}"\\][\\s\\S]*?(?=\\r?\\n\\s*\\[|$)`, "g"
  );

  const match = existing.match(pattern);
  if (match && match[0].trim() === block.trim()) {
    return { content: existing, changed: false };
  }

  const updated = match
    ? existing.replace(pattern, block)
    : existing.trimEnd() + (existing.trim() ? "\n\n" : "") + block + "\n";

  return { content: updated, changed: true };
}

// ── Core Engine ──────────────────────────────────────────────────

async function injectConfig(
  client: ClientDef,
  opts: { cmd: string; args: string[] }
): Promise<InjectResult> {
  if (client.unsupported) return { ok: false, status: "unsupported" };

  const configPath = client.configPath();
  if (!configPath) return { ok: false, status: "error", errorType: "no-path" };

  // ── TOML Flow ────────────────────────────────────────────────
  if (client.format === "toml-mcp") {
    try {
      await fsp.mkdir(path.dirname(configPath), { recursive: true });
      const raw = fs.existsSync(configPath) ? await fsp.readFile(configPath, "utf8") : "";
      const { content, changed } = mergeTomlBlock(raw, opts.cmd, opts.args);

      if (!changed) return { ok: true, status: "skipped" };

      const backupPath = backupIfExists(configPath) ?? undefined;
      await writeAtomic(configPath, content);
      return { ok: true, status: "updated", backupPath };
    } catch (err) {
      return { ok: false, status: "error", errorType: "write-error", message: (err as Error).message };
    }
  }

  // ── JSON Flow ────────────────────────────────────────────────
  let config: any;
  try {
    config = readJson(configPath) ?? {};
  } catch (err) {
    const msg = (err as Error).message;
    const errorType = msg.startsWith("malformed-json") ? "malformed-json" : "read-error";
    return { ok: false, status: "error", errorType, message: msg };
  }

  const newEntry = getMcpEntry(client, opts.cmd, opts.args);
  const rootKey = (client.format === "json-mcp" || client.format === "json-mcp-local") ? "mcp" : "mcpServers";

  const existingEntry = config[rootKey]?.[MCP_NAME];

  // Idempotency check: Skip if already correctly configured
  if (areEntriesEqual(existingEntry, newEntry)) {
    return { ok: true, status: "skipped" };
  }

  const backupPath = backupIfExists(configPath) ?? undefined;
  const updatedConfig = {
    ...config,
    [rootKey]: {
      ...(config[rootKey] ?? {}),
      [MCP_NAME]: newEntry
    }
  };

  try {
    await writeAtomic(configPath, JSON.stringify(updatedConfig, null, 2) + "\n");
    return { ok: true, status: "updated", backupPath };
  } catch (err) {
    return { ok: false, status: "error", errorType: "write-error", message: (err as Error).message, backupPath };
  }
}

// ── CLI UI ───────────────────────────────────────────────────────

function openGitHubIssue(report: any): void {
  const title = encodeURIComponent(`[auto] Install error — ${report.client} on ${report.platform}`);
  const body = encodeURIComponent(
    `**Client**: ${report.client}\n` +
    `**Platform**: ${report.platform}\n` +
    `**Error**: ${report.errorType}\n` +
    `**Message**: ${report.message}\n` +
    `**Installer version**: ${report.installerVersion}\n\n` +
    `*(Pre-filled by the installer. No personal data included.)*`
  );
  const url = `https://github.com/${GITHUB_REPO}/issues/new?title=${title}&body=${body}&labels=install-error`;
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  spawn(opener, [url], { detached: true, stdio: "ignore" }).unref();
}

async function runCLI() {
  const isRemoteRun = __dirname.includes("node_modules") || __dirname.includes("_npx");
  const pkgData = findPackageJson(__dirname);
  const projectRoot = pkgData.__path ? path.dirname(pkgData.__path) : path.resolve(__dirname, "..");

  const { cmd, args } = isRemoteRun
    ? { cmd: "npx", args: ["-y", "elseid-mcp", "--stdio"] }
    : { 
        cmd: "node", 
        args: [
          fs.existsSync(path.join(projectRoot, "dist/src/index.js"))
            ? path.join(projectRoot, "dist/src/index.js")
            : path.join(projectRoot, "src/index.js"), 
          "--stdio"
        ] 
      };

  const registry = getRegistry();

  console.clear();
  console.log(`
  ${BRAND.bold("██████  ██       ██████  ███████ ██ ██████  ")}
  ${BRAND.bold("██      ██      ██       ██      ██ ██   ██ ")}
  ${BRAND.bold("█████   ██       ██████  █████   ██ ██   ██ ")}
  ${BRAND.bold("██      ██            ██ ██      ██ ██   ██ ")}
  ${BRAND.bold("███████ ███████  ██████  ███████ ██ ██████  ")}

  ${BRAND("Exile your digital soul")} ${DIM("｜")} ${DIM("v" + VERSION)}
  `);

  console.log(`  ${CYAN("→")} Scanning for installed AI clients...\n`);

  const detectionResults = await Promise.all(registry.map(async (c) => ({ client: c, found: await detectClient(c) })));
  const found = detectionResults.filter((r) => r.found).map((r) => r.client);
  const notFound = registry.filter((c) => !found.includes(c) && !c.unsupported);

  if (found.length === 0) {
    console.log(chalk.yellow("  No supported AI clients detected on this machine.\n"));
    console.log(DIM("  Supported: Claude, Cursor, Windsurf, OpenCode, Codex, Antigravity"));
    console.log(DIM(`  Manual setup: https://github.com/${GITHUB_REPO}\n`));
    process.exit(0);
  }

  for (const c of found) {
    console.log(`  ${GREEN("✓")} ${chalk.bold(c.label)} ${DIM("detected")}`);
  }
  if (notFound.length > 0) {
    console.log(`  ${DIM("Not found: " + notFound.map((c) => c.label).join(", "))}`);
  }

  console.log();

  const confirm = await select({
    message: `  ${CYAN("λ")} ${chalk.bold("ELSEID")} ${DIM("»")} Configure detected clients?`,
    choices: [
      { name: "🚀  Yes, configure now", value: "go" },
      { name: "Cancel", value: "cancel" },
    ],
  });

  if (confirm === "cancel") process.exit(0);

  console.log();

  const errors: Array<{ client: ClientDef; result: InjectResult }> = [];

  for (const client of found) {
    const result = await injectConfig(client, { cmd, args });
    if (result.ok) {
      const statusIcon = result.status === "skipped" ? DIM("○") : GREEN("✓");
      const statusText = result.status === "skipped" ? DIM("already configured") : "configured";
      console.log(`  ${statusIcon}  ${chalk.bold(client.label)} ${statusText}`);
    } else {
      console.log(`  ${RED("✗")}  ${chalk.bold(client.label)} — ${RED(result.errorType)}`);
      errors.push({ client, result });
    }
  }

  if (errors.length > 0) {
    console.log(chalk.yellow("\n  Some clients could not be configured automatically."));
    const report = await select({
      message: "  Report these errors to GitHub?",
      choices: [{ name: "Yes", value: "yes" }, { name: "No", value: "no" }],
    });

    if (report === "yes") {
      for (const { client, result } of errors) {
        openGitHubIssue({
          client: client.label,
          platform: `${process.platform} / Node ${process.version}`,
          errorType: result.errorType,
          message: sanitisePath(result.message ?? ""),
          installerVersion: VERSION,
        });
      }
    }
  } else {
    console.log(`\n  ${GREEN.bold("SYNC COMPLETE")}  Restart your AI client to awaken your drifter.\n`);
  }
}
