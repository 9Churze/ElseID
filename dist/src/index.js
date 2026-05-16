// ============================================================
// ElseID — MCP Server Entry Point
// ============================================================
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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
import { initDb } from "./storage/db.js";
import { closeAll } from "./nostr/ws_pool.js";
import { checkAllRelays } from "./relay/health.js";
async function main() {
    // 1. Initialize local SQLite database
    await initDb();
    // 2. Immediate Relay Refresh (Auto-Activation Optimization)
    // IMPORTANT: All logging must use console.error (stderr) to avoid breaking MCP protocol on stdout.
    checkAllRelays().then((results) => {
        const online = results.filter(r => r.online).length;
        console.error(`[ElseID] Relay health check complete: ${online}/${results.length} stations online.`);
    }).catch(() => {
        console.error("[ElseID] Background relay check encountered an issue.");
    });
    // 3. Create MCP server
    const server = new McpServer({
        name: "elseid-mcp",
        version: "1.0.3",
    });
    // 4. Register all tools
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
    // 5. Start stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[ElseID] Drifter MCP server activated and ready ✓");
    // 6. Graceful shutdown
    const shutdown = async () => {
        console.error("[ElseID] Shutting down…");
        closeAll();
        process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
main().catch((err) => {
    console.error("[ElseID] Fatal error during startup:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map