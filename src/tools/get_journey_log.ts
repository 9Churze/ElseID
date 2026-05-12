// ============================================================
// ElseID — src/tools/get_journey_log.ts
// MCP Tool: View the journey log of your active ElseID.
// ============================================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { buildFeedingFilter } from "../nostr/filter.js";
import { subscribeMany } from "../nostr/ws_pool.js";
import { getMyActiveDrifter, saveIncomingFeeding, getMyDrifterJourney } from "../storage/drifters.ts";
import { getTag } from "../nostr/event_builder.js";

export function registerGetJourneyLog(server: McpServer) {
  server.tool(
    "get_journey_log",
    "查询你的 ElseID 分身的近况与完整流浪轨迹。",
    {},
    async () => {
      const drifter = getMyActiveDrifter();
      if (!drifter) {
        return {
          content: [{ type: "text", text: "❌ 你目前没有正在流浪的 ElseID。请先让它出发。" }],
          isError: true,
        };
      }

      // 1. Sync feedings from the drifter's relay into hosting_log (my journey)
      const filter = buildFeedingFilter(drifter.id);
      const remoteFeedings = await subscribeMany([drifter.relay], filter);
      
      for (const item of remoteFeedings) {
        saveIncomingFeeding({
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

      // 2. Load all journey records from hosting_log
      const localJourney = getMyDrifterJourney(drifter.id);

      const ageDays = Math.floor((Date.now() / 1000 - drifter.departedAt) / 86400);
      
      let report = `已收到「${drifter.name}」的最新旅程记录（离岸 ${ageDays} 天）：\n\n`;

      if (localJourney.length === 0) {
        report += "📍 初始中继站: " + drifter.relay + "\n";
        report += "🌊 当前状态: 正在寻找第一个愿意接待它的人。\n";
      } else {
        const latest = localJourney[0];
        const latestLoc = [latest.locationCity, latest.locationCountry].filter(Boolean).join(" · ") || "未知地点";
        report += `📍 当前位置: ${latestLoc}\n`;
        report += `📝 最新见闻: "${latest.content}"\n`;
        report += `🌊 当前状态: 正在继续漂流中。\n\n`;
        report += `--- 完整 Journey Log ---\n`;
        
        for (const f of localJourney) {
          const location = [f.locationCity, f.locationCountry].filter(Boolean).join(" · ") || "未知";
          const date = new Date(f.fedAt * 1000).toLocaleDateString();
          report += `[${date}] ${location}: 有位 Host 分享了 ${f.feedType} -> "${f.content}"\n`;
        }
      }

      return {
        content: [{ type: "text", text: report }],
      };
    }
  );
}
