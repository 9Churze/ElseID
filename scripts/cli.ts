import fs from "fs";
import path from "path";
import os from "os";
import { checkbox, input, select } from "@inquirer/prompts";
import chalk from "chalk";
import clipboardy from "clipboardy";

const CONFIG_PATHS = {
  claude: process.platform === "darwin" 
    ? path.join(os.homedir(), "Library/Application Support/Claude/claude_desktop_config.json")
    : path.join(os.homedir(), "AppData/Roaming/Claude/claude_desktop_config.json"),
  opencode: path.join(os.homedir(), ".config/opencode/opencode.json"),
};

const mcpConfigName = "elseid";
// Default to 'bicean' as per package.json, or absolute path for local dev
const projectRoot = process.cwd();
const isLocalDev = fs.existsSync(path.join(projectRoot, "package.json"));

const mcpConfigPayload = {
  type: "local",
  // If installing from source, use absolute path for reliability
  command: isLocalDev ? "node" : "npx",
  args: isLocalDev 
    ? [path.join(projectRoot, "dist/src/index.js")]
    : ["-y", "bicean@latest", "--stdio"],
  enabled: true
};

const BRAND_COLOR = chalk.hex('#818cf8'); 
const SUCCESS_COLOR = chalk.hex('#10b981'); 

async function injectConfig(client: string, configPath: string) {
  if (!fs.existsSync(configPath)) return false;
  try {
    const rawData = fs.readFileSync(configPath, "utf8");
    let config = JSON.parse(rawData);

    if (client === 'claude') {
      if (!config.mcpServers) config.mcpServers = {};
      config.mcpServers[mcpConfigName] = {
        command: mcpConfigPayload.command,
        args: mcpConfigPayload.args
      };
    } else if (client === 'opencode') {
      if (!config.mcp) config.mcp = {};
      config.mcp[mcpConfigName] = mcpConfigPayload;
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
    return true;
  } catch { return false; }
}

async function main() {
  console.clear();
  console.log(`
${BRAND_COLOR(`  ██████  ██       ██████  ███████ ██ ██████  
  ██      ██      ██       ██      ██ ██   ██ 
  █████   ██       ██████  █████   ██ ██   ██ 
  ██      ██            ██ ██      ██ ██   ██ 
  ███████ ███████  ██████  ███████ ██ ██████  `)}
  `);

  let state = {
    selectedClients: [] as string[],
    drifterName: '',
    drifterTraits: ''
  };

  let currentStep = 1;

  while (currentStep <= 3) {
    if (currentStep === 1) {
      console.log(chalk.gray(` 01 ──────────────────────────────────────────`));
      const clientChoices = [
        { name: '1. Claude Desktop', value: 'claude', checked: true },
        { name: '2. Cursor', value: 'cursor' },
        { name: '3. Codex', value: 'codex' },
        { name: '4. Antigravity', value: 'antigravity' },
        { name: '5. Gemini', value: 'gemini' },
        { name: '6. OpenCode', value: 'opencode' },
        { name: '7. Coze', value: 'coze' },
        { name: '8. WorkBuddy', value: 'workbuddy' },
        { name: '9. Other (Manual Setup)', value: 'other' }
      ];

      state.selectedClients = await checkbox({
        message: chalk.white(`Select AI clients (${clientChoices.length} available)\n${chalk.gray('  navigation: ↑↓  select: <space>  submit: ⏎')}`),
        choices: clientChoices.map(c => ({
          ...c, 
          checked: state.selectedClients.includes(c.value) || (state.selectedClients.length === 0 && c.checked)
        })),
      });

      if (state.selectedClients.length === 0) continue;
      currentStep = 2;
    }

    if (currentStep === 2) {
      console.log(chalk.gray(`\n 02 ──────────────────────────────────────────`));
      console.log(BRAND_COLOR.bold(` IDENTITY SETUP`));
      
      const nameInput = await input({
        message: chalk.white('Enter Drifter Name:'),
        default: state.drifterName || undefined,
        validate: (val) => {
          if (val.toLowerCase() === 'back') return true;
          return (val.trim().length >= 2 && val.length <= 20) || '2-20 chars.';
        },
      });

      if (nameInput.toLowerCase() === 'back') { currentStep = 1; console.clear(); continue; }
      state.drifterName = nameInput;

      const traitsInput = await input({
        message: chalk.white('Enter Identity Traits:'),
        default: state.drifterTraits || undefined,
        validate: (val) => {
          if (val.toLowerCase() === 'back') return true;
          return val.trim().length >= 3 || 'Traits required.';
        },
      });

      if (traitsInput.toLowerCase() === 'back') { currentStep = 1; console.clear(); continue; }
      state.drifterTraits = traitsInput;
      currentStep = 3;
    }

    if (currentStep === 3) {
      console.log(chalk.gray(`\n 03 ──────────────────────────────────────────`));
      console.log(BRAND_COLOR.bold(` FINAL REVIEW`));
      console.log(chalk.white(`   Clients:  ${state.selectedClients.join(', ')}`));
      console.log(chalk.white(`   Identity: ${state.drifterName}`));

      const confirmInstall = await select({
        message: chalk.white('Ready to install?'),
        choices: [
          { name: '🚀 Start Installation', value: 'go' },
          { name: 'Back to Step 1', value: 'back_1' },
          { name: 'Cancel', value: 'cancel' }
        ]
      });

      if (confirmInstall === 'back_1') { currentStep = 1; console.clear(); continue; }
      if (confirmInstall === 'cancel') process.exit(0);

      console.log(chalk.gray("\n  Installing..."));
      let showManualConfig = false;
      for (const client of state.selectedClients) {
        const pathKey = client as keyof typeof CONFIG_PATHS;
        if (CONFIG_PATHS[pathKey]) {
          const success = await injectConfig(client, CONFIG_PATHS[pathKey]);
          if (success) console.log(SUCCESS_COLOR(`  ✓ Successfully configured ${client}.`));
          else showManualConfig = true;
        } else {
          showManualConfig = true;
        }
      }

      if (showManualConfig) {
        const displayJson = { mcp: { [mcpConfigName]: mcpConfigPayload } };
        console.log(chalk.white(`\n  Manual JSON (Copied to clipboard):`));
        console.log(chalk.gray(JSON.stringify(displayJson, null, 2)));
        try { clipboardy.writeSync(JSON.stringify(displayJson, null, 2)); } catch {}
      }
      break;
    }
  }

  console.log(`\n  ${SUCCESS_COLOR.bold("SUCCESS")} Done. Restart your client.\n`);
}

main().catch((err) => { process.exit(1); });
