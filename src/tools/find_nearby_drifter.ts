// ElseID — src/tools/find_nearby_drifter.ts
// MCP Tool: Find digital drifters nearby.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getFuzzyLocation } from "../location/geo.js";
import { buildDrifterFilter } from "../nostr/filter.js";
import { subscribeRaceFirst } from "../nostr/ws_pool.js";
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
      const identity = await getPrimaryIdentity();
      const relayUrls = await pickRelaysForFetch(location, 3);
      const filter = buildDrifterFilter(20);

      const picked = await subscribeRaceFirst(
        relayUrls, 
        filter, 
        async (event) => {
          if (event.pubkey === identity.pubkey) return false;
          
          const isHosted = await hasHostedBefore(event.id);
          if (isHosted) {
            // Fate Mechanics (缘分机制): 
            // If we have hosted this drifter before, we don't want to get stuck 
            // encountering them every single time we search.
            // We introduce a 15% "fate" probability to meet them again.
            // Otherwise, we skip and keep listening for new signals.
            return Math.random() < 0.15;
          }
          
          return true;
        }
      );
      
      if (!picked) {
        return {
          content: [{ type: "text", text: "🌊 No ElseID signals detected in this sector. Try again later. (The cosmos is quiet today.)" }],
        };
      }

      const event = picked.event;
      const isFamiliar = await hasHostedBefore(event.id);

      const name = getTag(event.tags, "name") || "Unnamed Drifter";
      const personality = getTag(event.tags, "personality") || "Unknown";
      const origin = [getTag(event.tags, "city"), getTag(event.tags, "country")].filter(Boolean).join(", ") || "Corner of the world";

      const contentItems: Array<{ type: "text"; text: string }> = [
        {
          type: "text",
          text: JSON.stringify({ _meta: "elseid", isFamiliar, drifterId: event.id, drifterName: name, relay: picked.relay }),
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
