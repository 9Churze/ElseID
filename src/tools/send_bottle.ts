// ============================================================
// Bicean — src/tools/send_bottle.ts
// MCP Tool: send an anonymous drift bottle.
// ============================================================

import { McpServer }           from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }                   from "zod";
import { getFuzzyLocation }    from "../location/geo.js";
import { getSessionIdentity }  from "../storage/identity.js";
import { buildDriftEvent }     from "../nostr/event_builder.js";
import { signEvent }           from "../nostr/event_signer.js";
import { pickRelay }           from "../relay/selector.js";
import { broadcast }           from "../relay/broadcaster.js";
import { saveBottle, markAsSent } from "../storage/bottles.js";
import type { BottleInput }     from "../../types/index.js";

const schema = z.object({
  content:   z.string().min(1).max(2000).describe("Bottle text content"),
  mood:      z.enum(["lonely","happy","anxious","tired","hopeful","confused","calm"])
               .describe("The primary mood of the message (AI should determine this)"),
  lang:      z.enum(["zh","en","ja","ko"])
               .describe("The language of the message (AI should determine this)"),
  tags:      z.array(z.string().max(30)).max(10)
               .describe("Up to 10 topic tags (AI should determine these)"),
  ttl:       z.union([z.literal(3600), z.literal(86400), z.literal(604800), z.literal(0)])
               .optional()
               .default(86400)
               .describe("Time-to-live: 3600=1h, 86400=24h, 604800=7d, 0=forever"),
  anonymity: z.enum(["full","ephemeral","persistent"]).default("full")
               .describe("Identity level: full=new key, ephemeral=session key, persistent=fixed key"),
  relay:     z.string().url().optional().describe("Preferred relay URL"),
});

export function registerSendBottle(server: McpServer) {
  server.tool(
    "send_bottle",
    "Broadcast a drift bottle. AI AGENT: Before calling, analyze the user's content to determine the 'mood', 'lang', and 'tags'. Confirm anonymity level with the user.",
    schema.shape,
    async (input) => {
      // 1. Geography (Local fuzzy logic)
      const location = await getFuzzyLocation();

      // 2. Identity
      const identity = getSessionIdentity(input.anonymity);

      // 3. Build & Sign
      const unsigned = buildDriftEvent({
        input:  input as BottleInput,
        pubkey: identity.pubkey,
        location,
        emotion: { 
          mood: input.mood, 
          tone: "determined-by-ai", 
          tags: input.tags, 
          confidence: 1 
        },
      });

      const signed = signEvent(unsigned, identity.privkey);

      // 4. Broadcast
      const relayUrl = pickRelay(input.relay);
      const result   = await broadcast(signed, relayUrl);

      if (!result.success) {
        return {
          content: [{ type: "text", text: `⚠️ Broadcast failed: ${result.message}` }],
        };
      }

      // 5. Persist locally
      saveBottle(signed, relayUrl);
      markAsSent(signed.id, identity.pubkey);

      return {
        content: [{
          type: "text",
          text: `🌊 Bottle sent via ${relayUrl}\nMood: ${input.mood}\nTags: ${input.tags.join(", ")}`,
        }],
      };
    }
  );
}
