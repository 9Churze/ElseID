#!/usr/bin/env node
import fs from "fs";
import path from "path";
import os from "os";
import { select } from "@inquirer/prompts";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const DIM = chalk.gray;
const GREEN = chalk.greenBright;
const RED = chalk.red;
const CYAN = chalk.cyan;

// ── MCP Mode Detection ──────────────────────────────────────────
if (process.argv.includes("--stdio")) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const serverPath = path.resolve(__dirname, "..", "src", "index.js");
  const child = spawn("node", [serverPath, ...process.argv.slice(2)], { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code ?? 0));
} else {
  runCLI();
}

// ── Types ───────────────────────────────────────────────────────

/**
 * Config format variants.
 *
 * json-mcpServers  – { mcpServers: { [name]: { command, args } } }         Claude Desktop, Cursor, Windsurf
 * json-mcp         – { mcp:       { [name]: { command, args } } }          OpenCode
 * json-mcp-local   – { mcp:       { [name]: { type, command: [...] } } }   (future clients)
 * toml-mcp         – TOML [mcp_servers."name"] block                       Codex
 */
type ConfigFormat = "json-mcpServers" | "json-mcp" | "json-mcp-local" | "toml-mcp";

interface ClientDef {
  id: string;
  label: string;
  /** Where the config file lives. May not exist yet on fresh installs. */
  configPath: () => string;
  /**
   * Paths whose existence confirms the client is installed.
   * More reliable than configPath because the config file may not exist yet.
   * Falls back to configPath's parent directory if omitted.
   */
  detectPaths?: () => string[];
  format: ConfigFormat;
  /**
   * Extra fields merged into the root JSON config after the MCP entry is written.
   * E.g. OpenCode command palette entries.
   */
  extraMerge?: (config: any) => Record<string, any>;
  /** Show client in results but skip writing; print manualUrl instead. */
  unsupported?: true;
  manualUrl?: string;
  /** Last time this registry entry was manually verified against the real client. */
  verifiedAt?: string;
}

// ── Error Reporting ─────────────────────────────────────────────

const GITHUB_REPO = "elseid-mcp/elseid-mcp"; // ← update to real repo slug

interface ErrorReport {
  client: string;
  platform: string;
  errorType: string;
  message: string;
  installerVersion: string;
}

/** Replace the real home dir with ~ so no username is transmitted. */
function sanitisePath(p: string): string {
  return p.replace(os.homedir(), "~");
}

/**
 * Open a pre-filled GitHub issue in the default browser.
 * Entirely opt-in — only called after explicit user consent.
 * Nothing is sent to any server by this function itself.
 */
function openGitHubIssue(report: ErrorReport): void {
  const title = encodeURIComponent(
    `[auto] Install error — ${report.client} on ${report.platform}`
  );
  const body = encodeURIComponent(
    `**Client**: ${report.client}\n` +
    `**Platform**: ${report.platform}\n` +
    `**Error**: ${report.errorType}\n` +
    `**Message**: ${report.message}\n` +
    `**Installer version**: ${report.installerVersion}\n\n` +
    `*(Pre-filled by the installer. No config file contents or personal data included.)*`
  );
  const url =
    `https://github.com/${GITHUB_REPO}/issues/new` +
    `?title=${title}&body=${body}&labels=install-error`;

  const opener =
    process.platform === "darwin" ? "open" :
      process.platform === "win32" ? "start" : "xdg-open";
  spawn(opener, [url], { detached: true, stdio: "ignore" }).unref();
}

// ── Client Registry ─────────────────────────────────────────────
//
// To add a new client: append one entry here. Zero engine changes required.

function buildRegistry(cmd: string, args: string[]): ClientDef[] {
  const H = os.homedir();
  const isMac = process.platform === "darwin";
  const isWin = process.platform === "win32";

  return [
    // ── Supported ───────────────────────────────────────────────
    {
      id: "claude",
      label: "Claude Desktop",
      configPath: () =>
        isMac
          ? path.join(H, "Library/Application Support/Claude/claude_desktop_config.json")
          : path.join(H, "AppData/Roaming/Claude/claude_desktop_config.json"),
      detectPaths: () =>
        isMac
          ? ["/Applications/Claude.app", path.join(H, "Library/Application Support/Claude")]
          : [path.join(H, "AppData/Roaming/Claude")],
      format: "json-mcpServers",
      verifiedAt: "2025-05",
    },
    {
      id: "cursor",
      label: "Cursor",
      configPath: () =>
        isMac ? path.join(H, ".cursor/mcp.json") :
          isWin ? path.join(H, "AppData/Roaming/Cursor/User/globalStorage/mcp.json")
            : path.join(H, ".config/Cursor/User/globalStorage/mcp.json"),
      detectPaths: () =>
        isMac ? ["/Applications/Cursor.app", path.join(H, ".cursor")] :
          isWin ? [path.join(H, "AppData/Roaming/Cursor")]
            : [path.join(H, ".config/Cursor")],
      format: "json-mcpServers",
      verifiedAt: "2025-05",
    },
    {
      id: "windsurf",
      label: "Windsurf",
      configPath: () =>
        isMac ? path.join(H, ".codeium/windsurf/mcp_config.json") :
          isWin ? path.join(H, "AppData/Roaming/Windsurf/mcp_config.json")
            : path.join(H, ".codeium/windsurf/mcp_config.json"),
      detectPaths: () =>
        isMac ? ["/Applications/Windsurf.app", path.join(H, ".codeium/windsurf")] :
          isWin ? [path.join(H, "AppData/Roaming/Windsurf")]
            : [path.join(H, ".codeium/windsurf")],
      format: "json-mcpServers",
      verifiedAt: "2025-05",
    },
    {
      id: "opencode",
      label: "OpenCode",
      configPath: () => path.join(H, ".config/opencode/opencode.json"),
      detectPaths: () => [path.join(H, ".config/opencode")],
      format: "json-mcp",
      verifiedAt: "2025-05",
      extraMerge: (config) => {
        const ELSEID_CMDS = [
          {
            id: "elseid-home",
            name: "ElseID: Summon Butler",
            description: "Call your digital butler",
            prompt: "Hello Butler, manage my ElseID drifter.",
          },
          {
            id: "elseid-status",
            name: "ElseID: Status",
            description: "Check your avatar status",
            prompt: "Run elseid_get_journey_log.",
          },
        ];
        const existing: any[] = Array.isArray(config.commands) ? config.commands : [];
        return {
          commands: [
            ...existing.filter((c: any) => !String(c.id).startsWith("elseid-")),
            ...ELSEID_CMDS,
          ],
        };
      },
    },
    {
      id: "codex",
      label: "Codex",
      configPath: () => path.join(H, ".codex/config.toml"),
      detectPaths: () => [path.join(H, ".codex")],
      format: "toml-mcp",
      verifiedAt: "2025-05",
    },

    // ── Unsupported / coming soon ───────────────────────────────
    {
      id: "antigravity",
      label: "Antigravity",
      configPath: () => "",
      format: "json-mcpServers",
      unsupported: true,
      manualUrl: "https://docs.elseid.xyz/clients/antigravity",
    },
    {
      id: "codebuddy",
      label: "CodeBuddy CN",
      configPath: () => "",
      format: "json-mcpServers",
      unsupported: true,
      manualUrl: "https://docs.elseid.xyz/clients/codebuddy",
    },
    {
      id: "workbuddy",
      label: "WorkBuddy",
      configPath: () => "",
      format: "json-mcpServers",
      unsupported: true,
      manualUrl: "https://docs.elseid.xyz/clients/workbuddy",
    },
  ];
}

// ── Auto-Detection ──────────────────────────────────────────────

type DetectStatus = "found" | "not-found" | "unsupported";

/**
 * Check whether a client appears installed on this machine.
 * Never throws — returns "not-found" on any unexpected error.
 */
function detectClient(client: ClientDef): DetectStatus {
  if (client.unsupported) return "unsupported";
  try {
    const candidates = client.detectPaths
      ? client.detectPaths()
      : [path.dirname(client.configPath())];
    return candidates.some((p) => p && fs.existsSync(p)) ? "found" : "not-found";
  } catch {
    return "not-found";
  }
}

// ── Config Write Engine ─────────────────────────────────────────

const MCP_NAME = "elseid-mcp";

/** Read a JSON file safely. Returns null if missing/empty; throws "malformed-json: …" on parse error. */
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

/**
 * Write JSON atomically via a temp file.
 * A crash mid-write leaves the .tmp file, not a corrupted original.
 */
function writeJsonAtomic(filePath: string, data: any): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = filePath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, filePath);
}

/**
 * Copy the file to <file>.bak before touching it.
 * Returns the backup path, or null if the file didn't exist yet.
 * Non-fatal on failure (backup is best-effort).
 */
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

function mergeJsonMcpServers(config: any, entry: Record<string, any>): any {
  return { ...config, mcpServers: { ...(config.mcpServers ?? {}), [MCP_NAME]: entry } };
}

function mergeJsonMcp(config: any, entry: Record<string, any>): any {
  return { ...config, mcp: { ...(config.mcp ?? {}), [MCP_NAME]: entry } };
}

/** Upsert a TOML [mcp_servers."name"] block — only that block is touched. */
function mergeTomlBlock(existing: string, cmd: string, args: string[]): string {
  const block =
    `[mcp_servers."${MCP_NAME}"]\n` +
    `command = "${cmd}"\n` +
    `args = [${args.map((a) => `"${a}"`).join(", ")}]`;
  const pattern = new RegExp(
    `\\[mcp_servers\\."${MCP_NAME}"\\][\\s\\S]*?(?=\\n\\[|$)`, "g"
  );
  return pattern.test(existing)
    ? existing.replace(pattern, block)
    : existing.trimEnd() + "\n\n" + block + "\n";
}

interface InjectResult {
  ok: boolean;
  errorType?: string;   // machine-readable key, used for issue reporting
  message?: string;     // human-readable detail
  backupPath?: string;
}

async function injectConfig(
  client: ClientDef,
  opts: { cmd: string; args: string[] }
): Promise<InjectResult> {
  if (client.unsupported) return { ok: false, errorType: "unsupported" };

  const configPath = client.configPath();
  if (!configPath) return { ok: false, errorType: "no-path" };

  const backupPath = backupIfExists(configPath) ?? undefined;

  // ── TOML ──────────────────────────────────────────────────────
  if (client.format === "toml-mcp") {
    try {
      fs.mkdirSync(path.dirname(configPath), { recursive: true });
      const raw = fs.existsSync(configPath) ? fs.readFileSync(configPath, "utf8") : "";
      fs.writeFileSync(configPath, mergeTomlBlock(raw, opts.cmd, opts.args), "utf8");
      return { ok: true, backupPath };
    } catch (err) {
      return { ok: false, errorType: "write-error", message: (err as Error).message, backupPath };
    }
  }

  // ── JSON ──────────────────────────────────────────────────────
  let config: any;
  try {
    config = readJson(configPath) ?? {};
  } catch (err) {
    const msg = (err as Error).message;
    const errorType = msg.startsWith("malformed-json") ? "malformed-json" : "read-error";
    return { ok: false, errorType, message: msg, backupPath };
  }

  const mcpEntry: Record<string, any> =
    client.format === "json-mcp-local"
      ? { type: "local", command: ["npx", "-y", "elseid-mcp", "--stdio"], enabled: true }
      : { command: opts.cmd, args: opts.args };

  let updated =
    client.format === "json-mcp" || client.format === "json-mcp-local"
      ? mergeJsonMcp(config, mcpEntry)
      : mergeJsonMcpServers(config, mcpEntry);

  if (client.extraMerge) {
    updated = { ...updated, ...client.extraMerge(config) };
  }

  try {
    writeJsonAtomic(configPath, updated);
  } catch (err) {
    return { ok: false, errorType: "write-error", message: (err as Error).message, backupPath };
  }

  return { ok: true, backupPath };
}

// ── CLI UI ───────────────────────────────────────────────────────

function friendlyError(errorType: string | undefined, backupPath?: string): string {
  const bak = backupPath
    ? `\n     ${DIM("Backup saved at: " + sanitisePath(backupPath) + " — restore it manually if needed.")}`
    : "";

  switch (errorType) {
    case "malformed-json":
      return `Config file has a syntax error — likely from a previous manual edit.${bak}`;
    case "write-error":
      return `Could not write to config file. Check folder permissions.${bak}`;
    case "no-path":
      return `Platform not yet supported. See: https://docs.elseid.xyz/manual-install`;
    default:
      return `Unexpected error.${bak}`;
  }
}

async function runCLI() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const isRemoteRun = __dirname.includes("node_modules") || __dirname.includes("_npx");
  const projectRoot = path.resolve(__dirname, "..");

  const { cmd, args } = isRemoteRun
    ? { cmd: "npx", args: ["-y", "elseid-mcp", "--stdio"] }
    : { cmd: "node", args: [path.join(projectRoot, "dist/src/index.js"), "--stdio"] };

  const registry = buildRegistry(cmd, args);

  console.clear();
  const BRAND = chalk.hex("#8B94FF");

  console.log(`
  ${BRAND.bold("██████  ██       ██████  ███████ ██ ██████  ")}
  ${BRAND.bold("██      ██      ██       ██      ██ ██   ██ ")}
  ${BRAND.bold("█████   ██       ██████  █████   ██ ██   ██ ")}
  ${BRAND.bold("██      ██            ██ ██      ██ ██   ██ ")}
  ${BRAND.bold("███████ ███████  ██████  ███████ ██ ██████  ")}

  ${BRAND("Exile your digital soul")} ${DIM("｜")} ${DIM("0x7E 0x1D")}
  `);

  // ── Step 1: Auto-detect ─────────────────────────────────────
  console.log(`  ${CYAN("→")} Scanning for installed AI clients...\n`);

  const found = registry.filter((c) => detectClient(c) === "found");
  const notFound = registry.filter((c) => detectClient(c) === "not-found" && !c.unsupported);
  const unsupported = registry.filter((c) => c.unsupported);

  if (found.length === 0) {
    console.log(chalk.yellow("  No supported AI clients detected on this machine.\n"));
    console.log(DIM("  Supported: Claude Desktop, Cursor, Windsurf, OpenCode, Codex"));
    console.log(DIM("  Manual setup: https://docs.elseid.xyz/manual-install\n"));
    process.exit(0);
  }

  for (const c of found) {
    console.log(`  ${GREEN("✓")} ${chalk.bold(c.label)} ${DIM("detected")}`);
  }
  if (notFound.length > 0) {
    console.log(`  ${DIM("Not found: " + notFound.map((c) => c.label).join(", "))}`);
  }
  for (const c of unsupported) {
    console.log(`  ${DIM("○ " + c.label + " — coming soon")}`);
  }

  console.log();

  // ── Step 2: Confirm ──────────────────────────────────────────
  const prefix = `  ${CYAN("λ")} ${chalk.bold("ELSEID")} ${DIM("»")}`;
  const confirm = await select({
    message: `${prefix} Configure ${found.map((c) => c.label).join(", ")}?`,
    choices: [
      { name: "🚀  Yes, configure now", value: "go" },
      { name: "Cancel", value: "cancel" },
    ],
  });
  if (confirm === "cancel") process.exit(0);

  console.log();

  // ── Step 3: Write configs ────────────────────────────────────
  const errors: Array<{ client: ClientDef; result: InjectResult }> = [];

  for (const client of found) {
    const result = await injectConfig(client, { cmd, args });
    if (result.ok) {
      console.log(`  ${GREEN("✓")}  ${chalk.bold(client.label)} configured`);
    } else {
      console.log(`  ${RED("✗")}  ${chalk.bold(client.label)} — ${friendlyError(result.errorType, result.backupPath)}`);
      errors.push({ client, result });
    }
  }

  // Unsupported: show manual links
  if (unsupported.length > 0) {
    console.log();
    for (const c of unsupported) {
      console.log(`  ${DIM("○")}  ${c.label} ${DIM("→ manual setup:")} ${c.manualUrl ?? "https://docs.elseid.xyz"}`);
    }
  }

  // ── Step 4: Error reporting (opt-in) ─────────────────────────
  if (errors.length > 0) {
    console.log();
    console.log(chalk.yellow("  Some clients could not be configured automatically.\n"));
    console.log(DIM("  Help us fix this — we'll open a pre-filled GitHub issue in your browser."));
    console.log(DIM("  Only the error type, client name, and platform are included. Nothing personal.\n"));

    const report = await select({
      message: "  Open a GitHub issue to report this?",
      choices: [
        { name: "Yes — open in browser", value: "yes" },
        { name: "No thanks", value: "no" },
      ],
    });

    if (report === "yes") {
      for (const { client, result } of errors) {
        openGitHubIssue({
          client: client.label,
          platform: `${process.platform} / Node ${process.version}`,
          errorType: result.errorType ?? "unknown",
          message: sanitisePath(result.message ?? ""),
          installerVersion: "1.0.0", // replace with auto-injected version at build time
        });
      }
      console.log(GREEN("\n  Issue opened. Thank you!\n"));
    } else {
      console.log();
    }
  } else {
    console.log(`\n  ${GREEN.bold("SYNC COMPLETE")}  Restart your AI client to awaken your drifter.\n`);
  }
}
