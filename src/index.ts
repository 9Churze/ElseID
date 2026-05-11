// ============================================================
// Bicean — MCP Server Entry Point
// ============================================================

import { McpServer }           from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerSendBottle }  from "./tools/send_bottle.js";
import { registerFetchBottle } from "./tools/fetch_bottle.js";
import { registerReplyBottle }  from "./tools/reply_bottle.js";
import { registerDeleteBottle } from "./tools/delete_bottle.js";
import { registerRelayTools }  from "./tools/relay_tools.js";
import { initDb }              from "./storage/db.js";
import { purgeExpired }        from "./storage/bottles.js";
import { closeAll }            from "./nostr/ws_pool.js";
import { checkAllRelays }      from "./relay/health.js";

async function main() {
  // 1. Initialize local SQLite database
  await initDb();

  // 2. Purge expired bottles from previous sessions
  const purged = purgeExpired();
  if (purged > 0) console.error(`[Bicean] Purged ${purged} expired bottle(s)`);

  // 3. Pre-warm relay health cache in background
  checkAllRelays().catch(() => {/* non-fatal */});

  // 4. Create MCP server
  const server = new McpServer({
    name:    "bicean",
    version: "0.1.0",
  });

  // 5. Register all tools
  registerSendBottle(server);
  registerFetchBottle(server);
  registerReplyBottle(server);
  registerDeleteBottle(server);
  registerRelayTools(server);   // list_relays, check_relay_status, pick_relay, refresh_relays

  // 6. Start stdio transport (compatible with Claude MCP / Codex MCP / local runtime)
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[Bicean] MCP server started ✓");

  // 7. Graceful shutdown
  const shutdown = () => {
    console.error("[Bicean] Shutting down…");
    closeAll();
    process.exit(0);
  };
  process.on("SIGINT",  shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[Bicean] Fatal error:", err);
  process.exit(1);
});
