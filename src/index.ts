// ElseID — MCP Server Entry Point

import { McpServer }           from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerCreateDrifter }    from "./tools/create_drifter.js";
import { registerFindNearbyDrifter } from "./tools/find_nearby_drifter.js";
import { registerFeedDrifter }       from "./tools/feed_drifter.js";
import { registerAbandonDrifter }    from "./tools/abandon_drifter.js";
import { registerGetJourneyLog }     from "./tools/get_journey_log.js";
import { registerListPastMemories } from "./tools/list_past_memories.js";
import { registerRecoverDrifter }    from "./tools/recover_drifter.js";
import { registerRelayTools }        from "./tools/relay_tools.js";
import { initDb }                    from "./storage/db.js";
import { closeAll }                  from "./nostr/ws_pool.js";
import { checkAllRelays }            from "./relay/health.js";

async function main() {
  // Initialize local SQLite database
  await initDb();

  // Immediate Relay Refresh (Auto-Activation Optimization)
  // We trigger this immediately and don't block the main server startup.
  // This ensures that by the time the user sends their first prompt, 
  // the relay stats are already fresh.
  checkAllRelays().then((results) => {
    const online = results.filter(r => r.online).length;
    console.error(`[ElseID] Relay health check complete: ${online}/${results.length} stations online.`);
  }).catch(() => {
    console.error("[ElseID] Background relay check encountered an issue.");
  });

  // Create MCP server
  const server = new McpServer({
    name:    "elseid-mcp",
    version: "0.2.1", // Bumped version for the new architecture
  });

  // Register all tools
  registerCreateDrifter(server);
  registerFindNearbyDrifter(server);
  registerFeedDrifter(server);
  registerAbandonDrifter(server);
  registerGetJourneyLog(server);
  registerListPastMemories(server);
  registerRecoverDrifter(server);
  registerRelayTools(server);

  // Start stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[ElseID] Drifter MCP server activated and ready ✓");

  // Graceful shutdown
  const shutdown = () => {
    console.error("[ElseID] Shutting down…");
    closeAll();
    process.exit(0);
  };
  process.on("SIGINT",  shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[ElseID] Fatal error during startup:", err);
  process.exit(1);
});
