import fs from "fs";
import path from "path";
import os from "os";
import { checkbox, select } from "@inquirer/prompts";
import chalk from "chalk";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const CONFIG_PATHS = {
  claude: process.platform === "darwin"
    ? path.join(os.homedir(), "Library/Application Support/Claude/claude_desktop_config.json")
    : path.join(os.homedir(), "AppData/Roaming/Claude/claude_desktop_config.json"),
  opencode: path.join(os.homedir(), ".config/opencode/opencode.json"),
};

const mcpConfigName = "elseid";
const cmd = "node";
const args = [path.join(projectRoot, "dist/src/index.js"), "--stdio"];

const BRAND = chalk.hex('#8B94FF');
const SOCIAL_GREEN = chalk.greenBright;
const TECH_CYAN = chalk.cyan;
const DIM = chalk.gray;
const ITALIC = chalk.italic;
const SEPARATOR = DIM('—'.repeat(60));

function isClientSynced(client: string, configPath: string): boolean {
  if (!fs.existsSync(configPath)) return false;
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (client === 'claude') {
      return !!(config.mcpServers && config.mcpServers[mcpConfigName]);
    } else {
      return !!(config.mcp && config.mcp[mcpConfigName]);
    }
  } catch {
    return false;
  }
}

const OPENCODE_COMMANDS = [
  {
    id: "elseid-home",
    name: "ElseID: Summon Butler",
    description: "Call your digital butler to start an identity management session.",
    prompt: "Hello Butler, I'd like to discuss the management of my ElseID digital avatar."
  },
  {
    id: "elseid-status",
    name: "ElseID: Status Query",
    description: "Quickly check the current wandering location and status of your avatar.",
    prompt: "Run elseid_get_journey_log and tell me the current status of my avatar."
  },
  {
    id: "elseid-nearby",
    name: "ElseID: Encounter Search",
    description: "Search for other drifter signals passing nearby.",
    prompt: "Run elseid_find_nearby_drifter to see if there are any interesting souls nearby."
  },
  {
    id: "elseid-log",
    name: "ElseID: Journey Archive",
    description: "View full wandering trajectory and feeding history logs.",
    prompt: "I want to view the complete journey trajectory and feeding history archive of my avatar."
  }
];

async function injectConfig(client: string, configPath: string) {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let config: any = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch { config = {}; }
  }

  if (client === 'claude') {
    if (!config.mcpServers) config.mcpServers = {};
    config.mcpServers[mcpConfigName] = { command: cmd, args: args };
  } else if (client === 'opencode' || client === 'cursor' || client === 'windsurf') {
    if (!config.mcp) config.mcp = {};
    config.mcp[mcpConfigName] = { type: "local", command: [cmd, ...args], enabled: true };
    if (client === 'opencode') {
      if (!config.commands) config.commands = [];
      config.commands = config.commands.filter((c: any) => !c.id.startsWith("elseid-"));
      config.commands.push(...OPENCODE_COMMANDS);
    }
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
  return true;
}

async function main() {
  console.clear();

  // ── Welcome & Branding ──────────────────────────────────────────
  console.log(`  ${DIM('Welcome to ELSEID - An AI-driven Decentralized Habitat.')}`);

  const logoHeader = `
  ${BRAND.bold(`██████  ██       ██████  ███████ ██ ██████  `)}
  ${BRAND.bold(`██      ██      ██       ██      ██ ██   ██ `)}
  ${BRAND.bold(`█████   ██       ██████  █████   ██ ██   ██ `)}
  ${BRAND.bold(`██      ██            ██ ██      ██ ██   ██ `)}
  ${BRAND.bold(`███████ ███████  ██████  ███████ ██ ██████  `)}
  
  ${BRAND('Exile your digital soul')} ${DIM('｜')} ${DIM('0x7E 0x1D')}
  `;

  console.log(logoHeader);
  console.log(`  ${SEPARATOR}`);
  console.log(`  ${ITALIC('"Anchored in reality, drifting into the unknown."')}`);
  console.log(`
  Here, you will possess a ${BRAND('self-evolving digital avatar')}.
  Your shadow in the cyber-wasteland, traversing encrypted nodes 
  on your behalf, embarking on an ${TECH_CYAN('endless journey of discovery')}.`);
  console.log(`  ${SEPARATOR}\n`);

  const promptPrefix = `${TECH_CYAN('λ')} ${chalk.bold('ELSEID')} ${DIM('»')}`;

  const clientChoices = [
    { name: '1. Claude Desktop', value: 'claude', checked: true },
    { name: '2. OpenCode', value: 'opencode' },
    { name: '3. Cursor', value: 'cursor' },
    { name: '4. Windsurf', value: 'windsurf' },
    { name: '5. Trae (ByteDance)', value: 'trae' },
    { name: '6. Codex', value: 'codex' },
    { name: '7. Antigravity', value: 'antigravity' },
    { name: '8. Gemini', value: 'gemini' },
    { name: '9. Continue', value: 'continue' },
    { name: '10. Roo Code', value: 'roocode' },
    { name: '11. Other (Manual Setup)', value: 'other' }
  ].filter(choice => {
    const pathKey = choice.value as keyof typeof CONFIG_PATHS;
    const configPath = CONFIG_PATHS[pathKey];
    if (configPath && isClientSynced(choice.value, configPath)) {
      return false;
    }
    return true;
  });

  if (clientChoices.length === 0) {
    console.log(`  ${SOCIAL_GREEN("✨ All supported AI clients are already synchronized with your digital soul.")}\n`);
    console.log(`  ${DIM("Use 'npm run cli' again if you install new AI clients in the future.")}\n`);
    process.exit(0);
  }

  const selectedClients = await checkbox({
    message: `${promptPrefix} ${chalk.white('Select AI clients to sync with your digital avatar:')}\n`,
    choices: clientChoices,
  });

  if (selectedClients.length === 0) process.exit(0);

  console.log(`\n  ${DIM('──────────────────────────────────────────')}`);
  const confirm = await select({
    message: `${promptPrefix} ${chalk.white('Ready to synchronize your soul\'s trajectory?')}`,
    choices: [{ name: '🚀 Sync Now', value: 'go' }, { name: 'Cancel', value: 'cancel' }]
  });

  if (confirm === 'cancel') process.exit(0);

  console.log(chalk.gray("\n  Injecting protocol..."));
  for (const client of selectedClients) {
    const pathKey = client as keyof typeof CONFIG_PATHS;
    const configPath = CONFIG_PATHS[pathKey];
    if (configPath) {
      await injectConfig(client, configPath);
      console.log(SOCIAL_GREEN(`  ✓ ${client} protocol activated`));
    } else {
      console.log(DIM(`  - ${client}: Manual setup required`));
    }
  }

  console.log(`\n  ${SOCIAL_GREEN.bold("SYNC SUCCESS")} Identity ready. Restart your client and call the Butler.\n`);
}

main().catch(() => process.exit(1));
