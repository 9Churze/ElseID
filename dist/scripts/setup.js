// ElseID — scripts/setup.ts
// Automated installation and MCP configuration injection script (Zero-Config version)
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
const MCP_NAME = "elseid-mcp";
function getClaudeConfigPath() {
    const H = os.homedir();
    if (process.platform === "darwin") {
        return path.join(H, "Library/Application Support/Claude/claude_desktop_config.json");
    }
    if (process.platform === "win32") {
        return path.join(H, "AppData/Roaming/Claude/claude_desktop_config.json");
    }
    // Linux or other (Claude Desktop currently mainly on Mac/Win)
    return "";
}
async function setup() {
    console.log("🌊 Preparing ElseID signal connector (Zero-Config)...");
    const projectDir = process.cwd();
    // Install dependencies
    console.log("> Synchronizing dependencies (npm install)...");
    try {
        execSync("npm install", { stdio: "inherit" });
    }
    catch (e) {
        console.error("❌ Dependency installation failed. Please ensure Node.js and npm are installed.");
        return;
    }
    const configPath = getClaudeConfigPath();
    if (!configPath) {
        console.log("ℹ️  Automatic configuration for Claude Desktop is not supported on this platform.");
        console.log("   Please follow manual setup instructions in the README.");
    }
    else {
        console.log(`> Injecting MCP configuration into: ${configPath}`);
        if (!fs.existsSync(configPath)) {
            console.log("ℹ️  Claude Desktop configuration file not found. Skipping auto-injection.");
        }
        else {
            try {
                const raw = fs.readFileSync(configPath, "utf-8");
                const config = JSON.parse(raw);
                if (!config.mcpServers)
                    config.mcpServers = {};
                const entry = {
                    command: "node",
                    args: [
                        "--import",
                        "tsx/esm",
                        path.join(projectDir, "src/index.ts")
                    ]
                };
                // Idempotency check
                if (JSON.stringify(config.mcpServers[MCP_NAME]) === JSON.stringify(entry)) {
                    console.log("✅ MCP configuration is already up to date.");
                }
                else {
                    config.mcpServers[MCP_NAME] = entry;
                    // Delete old key if exists from previous versions
                    if (config.mcpServers.elseid)
                        delete config.mcpServers.elseid;
                    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
                    console.log("✅ MCP configuration injected successfully!");
                }
            }
            catch (e) {
                console.error(`❌ Configuration file update failed: ${e.message}`);
            }
        }
    }
    console.log("\n🎉 ElseID environment is ready! No API Key required.");
    console.log("Please fully quit and restart Claude Desktop, then say to the AI:");
    console.log("\x1b[36m%s\x1b[0m", "\"Hello Butler, I want to create an ElseID drifter.\"");
}
setup();
//# sourceMappingURL=setup.js.map