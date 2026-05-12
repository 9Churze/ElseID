// ============================================================
// Bicean — src/tools/find_nearby_drifter.ts
// MCP Tool: Find digital drifters nearby.
// ============================================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getFuzzyLocation } from "../location/geo.js";
import { buildDrifterFilter } from "../nostr/filter.js";
import { subscribeMany } from "../nostr/ws_pool.js";
import { pickRelaysForFetch } from "../relay/selector.js";
import { hasHostedBefore, saveHostingLog } from "../storage/drifters.ts";
import { getTag, getAllTags } from "../nostr/event_builder.js";
import { getPrimaryIdentity } from "../storage/identity.js";
import type { FuzzyLocation } from "../../types/index.js";

export function registerFindNearbyDrifter(server: McpServer) {
  server.tool(
    "find_nearby_drifter",
    "Look for digital drifters nearby. Prioritizes drifters in your country or region.",
    {},
    async () => {
      const location = await getFuzzyLocation();
      const identity = getPrimaryIdentity();
      const relayUrls = pickRelaysForFetch(location, 3);
      const filter = buildDrifterFilter(20);

      const rawEvents = await subscribeMany(relayUrls, filter);
      
      // Filter out:
      // 1. My own drifter
      // 2. Already hosted drifters
      const events = rawEvents.filter(item => {
        const isMine = item.event.pubkey === identity.pubkey;
        const hosted = hasHostedBefore(item.event.id);
        return !isMine && !hosted;
      });

      if (events.length === 0) {
        return {
          content: [{ type: "text", text: "🌊 No new drifters found nearby at the moment. Check again later." }],
        };
      }

      // Pick the best match (already prioritized by relay selection and time)
      const picked = events[0];
      const event = picked.event;

      // Log the hosting (initial arrival)
      saveHostingLog({
        id: Math.random().toString(36).slice(2),
        drifterId: event.id,
        drifterPubkey: event.pubkey,
        drifterName: getTag(event.tags, "name"),
        arrivedAt: Math.floor(Date.now() / 1000),
      });

      const name = getTag(event.tags, "name") || "A Nameless Drifter";
      const personality = getTag(event.tags, "personality") || "Unknown";
      const origin = [getTag(event.tags, "city"), getTag(event.tags, "country")].filter(Boolean).join(", ") || "Somewhere";
      const age = formatAge(event.created_at);

      return {
        content: [{
          type: "text",
          text: `🗺️ You have encountered a digital drifter!\n\n` +
                `Name: ${name}\n` +
                `Origin: ${origin}\n` +
                `Personality: ${personality}\n` +
                `Words: "${event.content}"\n` +
                `Drifting since: ${age}\n\n` +
                `How would you like to host it?\n` +
                `- 🗺️ Tell a story (use feed_drifter with type="story")\n` +
                `- 🍜 Recommend food (use feed_drifter with type="food")\n` +
                `- 📍 Recommend a place (use feed_drifter with type="place")\n` +
                `- 🚪 Send off (simply祝 it a safe journey)`
        }],
      };
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
