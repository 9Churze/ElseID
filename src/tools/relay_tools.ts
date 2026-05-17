// ElseID — src/tools/relay_tools.ts
// MCP Tools: list_relays, check_relay_status, pick_relay

import { McpServer }            from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }                    from "zod";
import { checkRelay, getCachedRelayInfo, checkAllRelays } from "../relay/health.js";
import { pickRelay }            from "../relay/selector.js";
import type { RelayInfo }       from "../../types/index.js";

export function registerRelayTools(server: McpServer) {

  // list_relays
  server.tool(
    "list_relays",
    "List all known relays with their cached online status and latency. Triggers a background refresh if data is stale.",
    {},
    async () => {
      const relays = await getCachedRelayInfo();

      if (relays.length === 0) {
        // No cache yet — run a fresh check
        const fresh = await checkAllRelays();
        return { content: [{ type: "text", text: formatRelayList(fresh) }] };
      }

      return { content: [{ type: "text", text: formatRelayList(relays) }] };
    }
  );

  // check_relay_status
  server.tool(
    "check_relay_status",
    "Perform a live health check on a specific Nostr relay and return its status.",
    { url: z.string().url().describe("WebSocket relay URL, e.g. wss://relay.damus.io") },
    async ({ url }) => {
      const info = await checkRelay(url);
      return {
        content: [{
          type: "text",
          text: [
            `🔌 Relay: ${info.url}`,
            `  Status  : ${info.online ? "🟢 Online" : "🔴 Offline"}`,
            `  Latency : ${info.latencyMs !== null ? `${info.latencyMs}ms` : "—"}`,
            `  Writable: ${info.writable ? "✅ Yes" : "❌ No"}`,
          ].join("\n"),
        }],
      };
    }
  );

  server.tool(
    "pick_relay",
    "Let the system pick the best available relay for launching a drifter.",
    {},
    async () => {
      const url = await pickRelay();
      return {
        content: [{
          type: "text",
          text: `🎯 Best relay selected: ${url}\n\nUse this relay to dispatch your drifter.`,
        }],
      };
    }
  );

  // refresh_relays
  server.tool(
    "refresh_relays",
    "Run a fresh health check on ALL known relays and update the local cache.",
    {},
    async () => {
      const results = await checkAllRelays();
      const online  = results.filter((r) => r.online).length;
      return {
        content: [{
          type: "text",
          text: [
            `✅ Relay check complete: ${online}/${results.length} online`,
            ``,
            formatRelayList(results),
          ].join("\n"),
        }],
      };
    }
  );
}

// Formatting

function formatRelayList(relays: RelayInfo[]): string {
  if (relays.length === 0) return "No relay data available.";

  const header = `📡 Relay Status (${relays.filter(r => r.online).length}/${relays.length} online)\n`;
  const rows = relays.map((r, i) => {
    const status  = r.online   ? "🟢" : "🔴";
    const write   = r.writable ? "✍️ " : "👁️ ";
    const latency = r.latencyMs !== null ? `${r.latencyMs}ms`.padStart(6) : "  —  ";
    const label = r.region ? `[${r.region}] Relay Station ${i + 1}` : `Relay Station ${i + 1}`;
    return `  ${status} ${write} ${latency}  ${label}`;
  });

  return header + rows.join("\n");
}
