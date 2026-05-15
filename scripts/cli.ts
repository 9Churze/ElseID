#!/usr/bin/env node
import fs from "fs";
import path from "path";
import os from "os";
import { checkbox, select } from "@inquirer/prompts";
import chalk from "chalk";
import { fileURLToPath } from 'url';
import { spawn } from "child_process";

// ──人格分裂逻辑：检测是否为 MCP 服务启动模式 ──────────────────────
// 如果检测到 --stdio 参数，说明是 AI 客户端在启动服务，我们直接跳转到服务端逻辑
if (process.argv.includes("--stdio")) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const serverPath = path.resolve(__dirname, "..", "src", "index.js");
  
  // 启动真正的 MCP 服务进程
  const child = spawn("node", [serverPath, ...process.argv.slice(2)], {
    stdio: "inherit"
  });
  
  child.on("exit", (code) => process.exit(code ?? 0));
  // 停止执行后续的 CLI 界面代码
} else {
  // 继续执行原有的 CLI 安装界面逻辑
  runCLI();
}

// ── Environment Detection ──────────────────────────────────────

async function runCLI() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const isRemoteRun = __dirname.includes('node_modules') || __dirname.includes('_npx');
  const projectRoot = path.resolve(__dirname, '..');

  const CONFIG_PATHS = {
    claude: process.platform === "darwin" 
      ? path.join(os.homedir(), "Library/Application Support/Claude/claude_desktop_config.json")
      : path.join(os.homedir(), "AppData/Roaming/Claude/claude_desktop_config.json"),
    opencode: path.join(os.homedir(), ".config/opencode/opencode.json"),
    codex: path.join(os.homedir(), ".codex/config.toml"),
  };

  const mcpConfigName = "elseid-mcp";

  function getExecutionDetails() {
    if (isRemoteRun) {
      return { command: "npx", args: ["-y", "elseid-mcp", "--stdio"] };
    } else {
      return { command: "node", args: [path.join(projectRoot, "dist/src/index.js"), "--stdio"] };
    }
  }

  const { command: cmd, args } = getExecutionDetails();

  // ── Injection Logic ───────────────────────────────────────────
  async function injectConfig(client: string, configPath: string) {
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (client === 'codex') {
      let content = fs.existsSync(configPath) ? fs.readFileSync(configPath, "utf8") : "";
      const mcpBlock = `\n[mcp_servers."${mcpConfigName}"]\ncommand = "${cmd}"\nargs = [${args.map(a => `"${a}"`).join(", ")}]\n`;
      const regex = new RegExp(`\\[mcp_servers\\."${mcpConfigName}"\\][\\s\\S]*?(?=\\n\\[|$)`, 'g');
      content = regex.test(content) ? content.replace(regex, mcpBlock.trim()) : content + mcpBlock;
      fs.writeFileSync(configPath, content.trim() + "\n", "utf8");
      return true;
    }

    let config: any = {};
    if (fs.existsSync(configPath)) {
      try { config = JSON.parse(fs.readFileSync(configPath, "utf8")); } catch { config = {}; }
    }

    if (client === 'claude') {
      if (!config.mcpServers) config.mcpServers = {};
      config.mcpServers[mcpConfigName] = { command: cmd, args: args };
    } else {
      if (!config.mcp) config.mcp = {};
      config.mcp[mcpConfigName] = { 
        type: "local", 
        command: isRemoteRun ? ["npx", "-y", "elseid-mcp", "--stdio"] : [cmd, ...args], 
        enabled: true 
      };
      if (client === 'opencode') {
        const OPENCODE_COMMANDS = [
          { id: "elseid-home", name: "ElseID: Summon Butler", description: "Call your digital butler", prompt: "Hello Butler, manage my ElseID drifter." },
          { id: "elseid-status", name: "ElseID: Status", description: "Check your avatar status", prompt: "Run elseid_get_journey_log." }
        ];
        if (!config.commands) config.commands = [];
        config.commands = config.commands.filter((c: any) => !c.id.startsWith("elseid-"));
        config.commands.push(...OPENCODE_COMMANDS);
      }
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
    return true;
  }

  // ── UI Logic ──────────────────────────────────────────────────
  console.clear();
  const BRAND = chalk.hex('#8B94FF'); 
  const TECH_CYAN = chalk.cyan;            
  const DIM = chalk.gray;

  console.log(`
  ${BRAND.bold(`██████  ██       ██████  ███████ ██ ██████  `)}
  ${BRAND.bold(`██      ██      ██       ██      ██ ██   ██ `)}
  ${BRAND.bold(`█████   ██       ██████  █████   ██ ██   ██ `)}
  ${BRAND.bold(`██      ██            ██ ██      ██ ██   ██ `)}
  ${BRAND.bold(`███████ ███████  ██████  ███████ ██ ██████  `)}
  
  ${BRAND('Exile your digital soul')} ${DIM('｜')} ${DIM('0x7E 0x1D')}
  `);

  const promptPrefix = `${TECH_CYAN('λ')} ${chalk.bold('ELSEID')} ${DIM('»')}`;
  const clientChoices = [
    { name: '1. Claude Desktop', value: 'claude', checked: true },
    { name: '2. OpenCode', value: 'opencode', checked: true },
    { name: '3. Codex (TOML Sync)', value: 'codex' },
    { name: '4. Cursor', value: 'cursor' },
    { name: '5. Windsurf', value: 'windsurf' },
    { name: '6. Other (Manual)', value: 'other' }
  ];

  const selectedClients = await checkbox({
    message: `${promptPrefix} ${chalk.white('Select AI clients to sync:')}\n`,
    choices: clientChoices,
  });

  if (selectedClients.length === 0) process.exit(0);

  const confirm = await select({
    message: `\n  ${promptPrefix} ${chalk.white('Ready to synchronize your soul\'s trajectory?')}`,
    choices: [{ name: '🚀 Sync Now', value: 'go' }, { name: 'Cancel', value: 'cancel' }]
  });

  if (confirm === 'cancel') process.exit(0);

  for (const client of selectedClients) {
    const pathKey = client as keyof typeof CONFIG_PATHS;
    const configPath = CONFIG_PATHS[pathKey];
    if (configPath) {
      await injectConfig(client, configPath);
      console.log(chalk.greenBright(`  ✓ ${client} protocol activated`));
    }
  }
  console.log(`\n  ${chalk.greenBright.bold("SYNC SUCCESS")} Identity ready. Restart your client.\n`);
}
