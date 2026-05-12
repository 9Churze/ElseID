// ============================================================
// ElseID — src/tools/find_nearby_drifter.ts
// MCP Tool: Find digital drifters nearby.
// ============================================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getFuzzyLocation } from "../location/geo.js";
import { buildDrifterFilter } from "../nostr/filter.js";
import { subscribeMany } from "../nostr/ws_pool.js";
import { pickRelaysForFetch } from "../relay/selector.js";
import { hasHostedBefore } from "../storage/drifters.js";
import { getTag } from "../nostr/event_builder.js";
import { getPrimaryIdentity } from "../storage/identity.js";

export function registerFindNearbyDrifter(server: McpServer) {
  server.tool(
    "find_nearby_drifter",
    "邂逅附近的流浪者。优先发现同国或同城的中继信号。",
    {},
    async () => {
      const location = await getFuzzyLocation();
      const identity = getPrimaryIdentity();
      const relayUrls = pickRelaysForFetch(location, 3);
      const filter = buildDrifterFilter(20);

      const rawEvents = await subscribeMany(relayUrls, filter);
      
      const events = rawEvents.filter(item => item.event.pubkey !== identity.pubkey);
      
      if (events.length === 0) {
        return {
          content: [{ type: "text", text: "🌊 暂时没有路过的 ElseID 分身。请稍后再来。" }],
        };
      }

      // Prioritize drifters we haven't met yet
      const sortedEvents = [...events].sort((a, b) => {
        const aHosted = hasHostedBefore(a.event.id) ? 1 : 0;
        const bHosted = hasHostedBefore(b.event.id) ? 1 : 0;
        return aHosted - bHosted; // 0 (new) before 1 (hosted)
      });

      const picked = sortedEvents[0];
      const event = picked.event;
      const isFamiliar = hasHostedBefore(event.id);

      const name = getTag(event.tags, "name") || "无名分身";
      const personality = getTag(event.tags, "personality") || "未知";
      const origin = [getTag(event.tags, "city"), getTag(event.tags, "country")].filter(Boolean).join(", ") || "世界角落";

      // S-04 fix: Convey isFamiliar via a structured metadata block rather than
      // prepending a raw tag string that may leak to the user-facing output.
      const contentItems: Array<{ type: "text"; text: string }> = [
        {
          type: "text",
          text: JSON.stringify({ _meta: "elseid", isFamiliar, drifterId: event.id, relay: picked.relay }),
        },
        {
          type: "text",
          text: `🛰️ 检测到附近存在流浪信号。打捞成功！\n\n` +
               `「${name}」\n` +
               `📍 来源: ${origin}\n` +
               `🏷️ 人格标签: ${personality}\n` +
               `💬 心声: "${event.content}"\n\n` +
               `它正在你的终端短暂停留。你愿意为它留下一点关于这个世界的东西吗？\n\n` +
               `你可以进行以下投喂：\n` +
               `- [A] 留下一段话 (feed_drifter type="story")\n` +
               `- [B] 分享声音或美食 (feed_drifter type="food")\n` +
               `- [C] 推荐一个地方 (feed_drifter type="place")\n` +
               `- [D] 分享自己的生活经验 (feed_drifter type="other")`,
        },
      ];

      return { content: contentItems };
    }
  );
}

function formatAge(createdAt: number): string {
  const sec = Math.floor(Date.now() / 1000) - createdAt;
  if (sec < 60)   return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}
