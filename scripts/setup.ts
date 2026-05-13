// ElseID — scripts/setup.ts
// Automated installation and MCP configuration injection script (Zero-Config version)

import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const CONFIG_PATH = path.join(
  os.homedir(),
  "Library/Application Support/Claude/claude_desktop_config.json"
);

async function setup() {
  console.log("🌊 Preparing ElseID signal connector (Zero-Config)...");

  const projectDir = process.cwd();

  // Install dependencies
  console.log("> Synchronizing dependencies (npm install)...");
  try {
    execSync("npm install", { stdio: "inherit" });
  } catch (e) {
    console.error("❌ Dependency installation failed. Please ensure Node.js and npm are installed.");
    return;
  }

  // Modify Claude Desktop configuration
  console.log(`> Injecting MCP configuration into: ${CONFIG_PATH}`);
  
  if (!fs.existsSync(CONFIG_PATH)) {
    console.log("ℹ️  Claude Desktop configuration file not found. Skipping auto-injection.");
  } else {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
      
      if (!config.mcpServers) config.mcpServers = {};
      
      config.mcpServers.elseid = {
        command: "node",
        args: [
          "--import",
          "tsx/esm",
          path.join(projectDir, "src/index.ts")
        ]
      };

      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      console.log("✅ MCP configuration injected successfully!");
    } catch (e: any) {
      console.error(`❌ Configuration file update failed: ${e.message}`);
    }
  }

  console.log("\n🎉 ElseID environment is ready! No API Key required.");
  console.log("Please fully quit and restart Claude Desktop, then say to the AI:");
  console.log(
    "\x1b[36m%s\x1b[0m",
    "\"Hello Butler, I want to create an ElseID drifter.\""
  );
}

setup();
