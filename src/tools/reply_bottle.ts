// ============================================================
// Bicean — src/tools/reply_bottle.ts
// MCP Tool: send an anonymous reply to a drift bottle.
// ============================================================

import { McpServer }           from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }                   from "zod";
import { getSessionIdentity }  from "../storage/identity.js";
import { buildReplyEvent }     from "../nostr/event_builder.js";
import { signEvent }           from "../nostr/event_signer.js";
import { broadcast }           from "../relay/broadcaster.js";
import { pickRelay }           from "../relay/selector.js";
import { getBottle }           from "../storage/bottles.js";

const schema = z.object({
  event_id: z.string().length(64).describe("Hex event ID of the original bottle"),
  content:  z.string().min(1).max(2000).describe("Your anonymous reply"),
  mood:     z.enum(["lonely","happy","anxious","tired","hopeful","confused","calm"])
              .describe("Mood of the reply (AI should determine this)"),
  lang:     z.enum(["zh","en","ja","ko"])
              .describe("Language of the reply (AI should determine this)"),
  anonymity: z.enum(["full","ephemeral","persistent"]).default("full"),
});

export function registerReplyBottle(server: McpServer) {
  server.tool(
    "reply_bottle",
    "Send an anonymous reply. AI AGENT: Determine 'mood' and 'lang' before calling.",
    schema.shape,
    async (input) => {
      // 1. Resolve relay
      const originalBottle = getBottle(input.event_id);
      const relayUrl = originalBottle?.relay ? pickRelay(originalBottle.relay) : pickRelay();

      // 2. Identity
      const identity = getSessionIdentity(input.anonymity);

      // 3. Build & Sign
      const unsigned = buildReplyEvent({
        content:         input.content,
        pubkey:          identity.pubkey,
        originalEventId: input.event_id,
        mood:            input.mood,
        lang:            input.lang,
      });

      const signed = signEvent(unsigned, identity.privkey);

      // 4. Broadcast
      const result = await broadcast(signed, relayUrl);

      if (!result.success) {
        return {
          content: [{ type: "text", text: `⚠️ Reply failed: ${result.message}` }],
        };
      }

      return {
        content: [{
          type: "text",
          text: `💬 Reply sent via ${relayUrl}\nMood: ${input.mood}`,
        }],
      };
    }
  );
}
