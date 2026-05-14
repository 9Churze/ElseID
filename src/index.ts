// ElseID — MCP Server Entry Point

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { registerCreateDrifter } from "./tools/create_drifter.js";
import { registerFindNearbyDrifter } from "./tools/find_nearby_drifter.js";
import { registerFeedDrifter } from "./tools/feed_drifter.js";
import { registerAbandonDrifter } from "./tools/abandon_drifter.js";
import { registerGetJourneyLog } from "./tools/get_journey_log.js";
import { registerListPastMemories } from "./tools/list_past_memories.js";
import { registerGetMyEncounters } from "./tools/get_my_encounters.js";
import { registerRecoverDrifter } from "./tools/recover_drifter.js";
import { registerRelayTools } from "./tools/relay_tools.js";
import { registerSetHostName } from "./tools/set_host_name.js";
import { registerEvolveDrifter } from "./tools/evolve_drifter.js";
import { initDb, closeDb } from "./storage/db.js";
import { closeAll } from "./nostr/ws_pool.js";
import { checkAllRelays } from "./relay/health.js";
import { redactSecrets } from "./utils/redact.js";

async function main() {
  await initDb();

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const pkgPath = path.join(__dirname, "..", "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  // Immediate Relay Refresh (Auto-Activation Optimization)
  checkAllRelays().then((results) => {
    const online = results.filter(r => r.online).length;
    console.log(`[ElseID] Relay health check complete: ${online}/${results.length} stations online.`);
  }).catch(() => {
    console.warn("[ElseID] Background relay check encountered an issue.");
  });

  const server = new McpServer({
    name: "elseid-mcp",
    version: pkg.version,
  });

  registerCreateDrifter(server);
  registerFindNearbyDrifter(server);
  registerFeedDrifter(server);
  registerAbandonDrifter(server);
  registerGetJourneyLog(server);
  registerListPastMemories(server);
  registerGetMyEncounters(server);
  registerRecoverDrifter(server);
  registerRelayTools(server);
  registerSetHostName(server);
  registerEvolveDrifter(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.log("[ElseID] Drifter MCP server activated and ready ✓");

  const shutdown = async () => {
    console.log("[ElseID] Shutting down…");
    closeAll();
    await closeDb();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[ElseID] Fatal error during startup:", redactSecrets(err));
  process.exit(1);
});
