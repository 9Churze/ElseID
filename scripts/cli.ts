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
};

const mcpConfigName = "elseid";
const mcpConfigPayload = {
  type: "local",
  command: ["npx", "-y", "elseid-mcp@latest", "--stdio"],
  enabled: true
};

const BRAND_COLOR = chalk.hex('#818cf8'); // Indigo-400
const ACCENT_COLOR = chalk.hex('#94a3b8'); // Slate-400
const SUCCESS_COLOR = chalk.hex('#10b981'); // Emerald-500

async function injectClaudeConfig(configPath: string) {
  if (!fs.existsSync(configPath)) return false;
  try {
    const rawData = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(rawData);
    if (!config.mcpServers) config.mcpServers = {};
    config.mcpServers[mcpConfigName] = mcpConfigPayload;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
    return true;
  } catch { return false; }
}

async function main() {
  console.clear();
  
  // High-end Pixel/Blocky Logo Design for ELSEID
  console.log(`
${BRAND_COLOR(`  ██████  ██       ██████  ███████ ██ ██████  
  ██      ██      ██       ██      ██ ██   ██ 
  █████   ██       ██████  █████   ██ ██   ██ 
  ██      ██            ██ ██      ██ ██   ██ 
  ███████ ███████  ██████  ███████ ██ ██████  `)}
  
  ${ACCENT_COLOR("A decentralized identity for the wandering world.")}
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

      if (state.selectedClients.length === 0) {
        console.log(chalk.yellow("\n  ⚠ Please select at least one client to proceed."));
        continue;
      }
      currentStep = 2;
    }

    if (currentStep === 2) {
      console.log(chalk.gray(`\n 02 ──────────────────────────────────────────`));
      console.log(BRAND_COLOR.bold(` IDENTITY SETUP`));
      console.log(chalk.gray(` (Type "back" to return to step 1)`));
      
      const nameInput = await input({
        message: chalk.white('Enter Drifter Name:'),
        default: state.drifterName || undefined,
        validate: (val) => {
          if (val.toLowerCase() === 'back') return true;
          return (val.trim().length >= 2 && val.length <= 20) || '2-20 chars required.';
        },
      });

      if (nameInput.toLowerCase() === 'back') {
        currentStep = 1; console.clear(); continue;
      }
      state.drifterName = nameInput;

      const traitsInput = await input({
        message: chalk.white('Enter Personality Traits (e.g. brave, romantic):'),
        default: state.drifterTraits || undefined,
        validate: (val) => {
          if (val.toLowerCase() === 'back') return true;
          return val.trim().length >= 3 || 'Traits required (min 3 chars).';
        },
      });

      if (traitsInput.toLowerCase() === 'back') {
        currentStep = 1; console.clear(); continue;
      }
      state.drifterTraits = traitsInput;

      const nav = await select({
        message: chalk.white('Proceed to installation?'),
        choices: [
          { name: 'Next ➔', value: 'next' },
          { name: 'Back ⬅', value: 'back' }
        ]
      });

      if (nav === 'back') {
        currentStep = 1; console.clear(); continue;
      }
      currentStep = 3;
    }

    if (currentStep === 3) {
      console.log(chalk.gray(`\n 03 ──────────────────────────────────────────`));
      console.log(BRAND_COLOR.bold(` FINAL REVIEW`));
      console.log(chalk.white(`   Clients:  ${ACCENT_COLOR(state.selectedClients.join(', '))}`));
      console.log(chalk.white(`   Identity: ${ACCENT_COLOR(state.drifterName)} [${state.drifterTraits}]`));
      console.log(chalk.gray(` ────────────────────────────────────────────`));

      const confirmInstall = await select({
        message: chalk.white('Ready to install ElseID?'),
        choices: [
          { name: '🚀 Start Installation', value: 'go' },
          { name: 'Modify Details (Step 2)', value: 'back_2' },
          { name: 'Modify Clients (Step 1)', value: 'back_1' },
          { name: 'Cancel', value: 'cancel' }
        ]
      });

      if (confirmInstall === 'back_2') { currentStep = 2; console.clear(); continue; }
      if (confirmInstall === 'back_1') { currentStep = 1; console.clear(); continue; }
      if (confirmInstall === 'cancel') { process.exit(0); }

      console.log(chalk.gray("\n  Processing..."));
      let showManualConfig = false;
      for (const client of state.selectedClients) {
        if (client === 'claude') {
          const success = await injectClaudeConfig(CONFIG_PATHS.claude);
          if (!success) showManualConfig = true;
          else console.log(SUCCESS_COLOR(`  ✓ Successfully configured Claude Desktop.`));
        } else {
          showManualConfig = true;
        }
      }

      if (showManualConfig) {
        const displayJson = { mcpServers: { [mcpConfigName]: mcpConfigPayload } };
        const jsonString = JSON.stringify(displayJson, null, 2);
        console.log(chalk.white(`\n  Manual configuration required:`));
        console.log(chalk.gray("\n" + jsonString + "\n"));
        try {
          clipboardy.writeSync(jsonString);
          console.log(SUCCESS_COLOR("  ✓ JSON configuration copied to clipboard."));
        } catch { }
      }
      break;
    }
  }

  console.log(`\n  ${SUCCESS_COLOR.bold("SUCCESS")} Setup complete. Good luck, ${state.drifterName}.\n`);
}

main().catch((err) => {
  if (err.name === 'ExitPromptError') console.log(chalk.gray('\n  Cancelled.'));
  else console.error(chalk.red("\n  Error:"), err);
  process.exit(1);
});
