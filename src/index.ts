// ============================================================
// ElseID — MCP Server Entry Point
// ============================================================

import { McpServer }           from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerCreateDrifter }    from "./tools/create_drifter.js";
import { registerFindNearbyDrifter } from "./tools/find_nearby_drifter.js";
import { registerFeedDrifter }       from "./tools/feed_drifter.js";
import { registerAbandonDrifter }    from "./tools/abandon_drifter.js";
import { registerGetJourneyLog }     from "./tools/get_journey_log.js";
import { registerRelayTools }        from "./tools/relay_tools.js";
import { initDb }                    from "./storage/db.js";
import { closeAll }                  from "./nostr/ws_pool.js";
import { checkAllRelays }            from "./relay/health.js";

async function main() {
  // 1. Initialize local SQLite database
  await initDb();

  // 2. Pre-warm relay health cache in background
  checkAllRelays().catch(() => {/* non-fatal */});

  // 3. Create MCP server
  const server = new McpServer({
    name:    "elseid-mcp",
    version: "0.2.0",
  });

  // 4. Register all tools
  registerCreateDrifter(server);
  registerFindNearbyDrifter(server);
  registerFeedDrifter(server);
  registerAbandonDrifter(server);
  registerGetJourneyLog(server);
  registerRelayTools(server);   // list_relays, check_relay_status, pick_relay, refresh_relays

  // 5. Start stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[ElseID] Drifter MCP server started ✓");

  // 6. Graceful shutdown
  const shutdown = () => {
    console.error("[ElseID] Shutting down…");
    closeAll();
    process.exit(0);
  };
  process.on("SIGINT",  shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[ElseID] Fatal error:", err);
  process.exit(1);
});
