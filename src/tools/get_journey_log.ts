// ============================================================
// Bicean — src/tools/get_journey_log.ts
// MCP Tool: View the journey log of your active drifter.
// ============================================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { buildFeedingFilter } from "../nostr/filter.js";
import { subscribeMany } from "../nostr/ws_pool.js";
import { getMyActiveDrifter, saveFeeding, getFeedingsForDrifter } from "../storage/drifters.ts";
import { getTag } from "../nostr/event_builder.js";

export function registerGetJourneyLog(server: McpServer) {
  server.tool(
    "get_journey_log",
    "Check the journey log and feedings of your active digital drifter.",
    {},
    async () => {
      const drifter = getMyActiveDrifter();
      if (!drifter) {
        return {
          content: [{ type: "text", text: "❌ You don't have an active drifter roaming the world." }],
          isError: true,
        };
      }

      // 1. Sync feedings from the drifter's relay
      const filter = buildFeedingFilter(drifter.id);
      const remoteFeedings = await subscribeMany([drifter.relay], filter);
      
      for (const item of remoteFeedings) {
        saveFeeding({
          id: item.event.id,
          drifterId: drifter.id,
          feederPubkey: item.event.pubkey,
          feedType: (getTag(item.event.tags, "feed_type") as any) || "other",
          content: item.event.content,
          locationCountry: getTag(item.event.tags, "country"),
          locationCity: getTag(item.event.tags, "city"),
          fedAt: item.event.created_at,
          relay: item.relay,
        });
      }

      // 2. Load all feedings from DB
      const localFeedings = getFeedingsForDrifter(drifter.id);

      const ageDays = Math.floor((Date.now() / 1000 - drifter.departedAt) / 86400);
      
      let report = `你的分身「${drifter.name}」已出发 ${ageDays} 天\n最近的旅程：\n\n`;

      if (localFeedings.length === 0) {
        report += "📍 它还在孤独地流浪，尚未有人接待它。\n";
      } else {
        for (const f of localFeedings) {
          const day = Math.floor((f.fedAt - drifter.departedAt) / 86400);
          const location = [f.locationCity, f.locationCountry].filter(Boolean).join(", ") || "Unknown Location";
          report += `📍 Day ${day} · ${location}\n`;
          report += `   有人分享了 ${f.feedType}\n`;
          report += `   "${f.content}"\n\n`;
        }
      }

      report += "它现在还在路上。";

      return {
        content: [{ type: "text", text: report }],
      };
    }
  );
}
