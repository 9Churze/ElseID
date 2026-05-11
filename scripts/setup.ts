// ============================================================
// Bicean — scripts/setup.ts
// 自动化安装与 MCP 配置文件注入脚本 (Zero-Config 版)
// ============================================================

import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const CONFIG_PATH = path.join(
  os.homedir(),
  "Library/Application Support/Claude/claude_desktop_config.json"
);

async function setup() {
  console.log("🌊 正在准备 Bicean 信号连接器 (Zero-Config)...");

  const projectDir = process.cwd();

  // 1. 安装依赖
  console.log("> 正在同步依赖零件 (npm install)...");
  try {
    execSync("npm install", { stdio: "inherit" });
  } catch (e) {
    console.error("❌ 依赖安装失败，请确保已安装 Node.js 和 npm。");
    return;
  }

  // 2. 修改 Claude Desktop 配置
  console.log(`> 正在注入 MCP 配置到: ${CONFIG_PATH}`);
  
  if (!fs.existsSync(CONFIG_PATH)) {
    console.log("ℹ️  未发现 Claude Desktop 配置文件，跳过自动注入。");
  } else {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
      
      if (!config.mcpServers) config.mcpServers = {};
      
      config.mcpServers.bicean = {
        command: "node",
        args: [
          "--import",
          "tsx/esm",
          path.join(projectDir, "src/index.ts")
        ]
      };

      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      console.log("✅ MCP 配置注入成功！");
    } catch (e: any) {
      console.error(`❌ 配置文件修改失败: ${e.message}`);
    }
  }

  console.log("\n🎉 Bicean 环境准备就绪！不需要任何 API Key 即可运行。");
  console.log("请完全退出并重启 Claude Desktop，然后对 AI 说：");
  console.log(
    "\x1b[36m%s\x1b[0m",
    "“你好，调频员，请帮我检查当前的二进制海信号状态。”"
  );
}

setup();
