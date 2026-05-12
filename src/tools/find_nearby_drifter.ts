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
    "Encounter digital drifters nearby. Prioritize signals from local or same-country relays.",
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
          content: [{ type: "text", text: "🌊 No ElseID signals detected in this sector. Try again later." }],
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

      const name = getTag(event.tags, "name") || "Unnamed Drifter";
      const personality = getTag(event.tags, "personality") || "Unknown";
      const origin = [getTag(event.tags, "city"), getTag(event.tags, "country")].filter(Boolean).join(", ") || "Corner of the world";

      // S-04 fix: Convey isFamiliar via a structured metadata block rather than
      // prepending a raw tag string that may leak to the user-facing output.
      const contentItems: Array<{ type: "text"; text: string }> = [
        {
          type: "text",
          text: JSON.stringify({ _meta: "elseid", isFamiliar, drifterId: event.id, relay: picked.relay }),
        },
        {
          type: "text",
          text: `🛰️ Nearby signal detected. Retrieval successful!\n\n` +
               `「${name}」\n` +
               `📍 Origin: ${origin}\n` +
               `🏷️ Personality: ${personality}\n` +
               `💬 Message: "${event.content}"\n\n` +
               `It is temporarily staying at your terminal. Would you like to leave something for it?\n\n` +
               `You can perform the following feedings:\n` +
               `- [A] Leave a message (feed_drifter type="story")\n` +
               `- [B] Share sound or food (feed_drifter type="food")\n` +
               `- [C] Recommend a place (feed_drifter type="place")\n` +
               `- [D] Share your life experience (feed_drifter type="other")`,
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
