// ============================================================
// Bicean — src/tools/reply_bottle.ts
// MCP Tool: send an anonymous reply to a drift bottle.
// Replies are also kind:7777 events with an ["e", <id>] tag.
// ============================================================

import { McpServer }           from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }                   from "zod";
import { checkContent }        from "../ai/moderator.js";
import { analyzeEmotion }      from "../ai/emotion.js";
import { detectLanguage }      from "../ai/language.js";
import { getSessionIdentity }  from "../storage/identity.js";
import { buildReplyEvent }     from "../nostr/event_builder.js";
import { signEvent }           from "../nostr/event_signer.js";
import { broadcast }           from "../relay/broadcaster.js";
import { pickRelay }           from "../relay/selector.js";
import { getBottle }           from "../storage/bottles.js";

const schema = z.object({
  event_id: z.string().length(64).describe("Hex event ID of the original bottle (from Reply ID field)"),
  content:  z.string().min(1).max(2000).describe("Your anonymous reply"),
  mood:     z.enum(["lonely","happy","anxious","tired","hopeful","confused","calm"]).optional(),
  anonymity: z.enum(["full","ephemeral","persistent"]).optional()
               .describe("Identity level (default: full)"),
});

export function registerReplyBottle(server: McpServer) {
  server.tool(
    "reply_bottle",
    "Send an anonymous reply to a drift bottle via Nostr relay",
    schema.shape,
    async (input) => {
      // ── 1. Validate event_id ──────────────────────────────────
      if (!/^[0-9a-f]{64}$/i.test(input.event_id)) {
        return {
          content: [{ type: "text", text: "❌ Invalid event ID. Must be 64-char hex." }],
        };
      }

      // ── 2. Moderation ─────────────────────────────────────────
      const modResult = await checkContent(input.content);
      if (!modResult.passed) {
        return {
          content: [{
            type: "text",
            text: `❌ Content blocked: ${modResult.reason ?? "policy violation"}`,
          }],
        };
      }

      // ── 3. Detect language + emotion ──────────────────────────
      const [detectedLang, emotion] = await Promise.all([
        detectLanguage(input.content),
        analyzeEmotion(input.content),
      ]);

      const mood = input.mood ?? emotion.mood;
      const lang = detectedLang;

      // ── 4. Resolve relay ─────────────────────────────────────
      // Try to reply on the same relay the original bottle came from
      const originalBottle = getBottle(input.event_id);
      const relayUrl = originalBottle?.relay
        ? pickRelay(originalBottle.relay)
        : pickRelay();

      // ── 5. Identity ───────────────────────────────────────────
      const level    = input.anonymity ?? "full";
      const identity = getSessionIdentity(level);

      // ── 6. Build + sign event ─────────────────────────────────
      const unsigned = buildReplyEvent({
        content:         input.content,
        pubkey:          identity.pubkey,
        originalEventId: input.event_id,
        mood,
        lang,
      });

      const signed = signEvent(unsigned, identity.privkey);

      // ── 7. Broadcast ──────────────────────────────────────────
      const result = await broadcast(signed, relayUrl);

      if (!result.success) {
        return {
          content: [{
            type: "text",
            text: `⚠️ Reply failed to send: ${result.message ?? "relay rejected event"}`,
          }],
        };
      }

      // ── 8. Response ───────────────────────────────────────────
      return {
        content: [{
          type: "text",
          text: [
            `💬 Reply sent anonymously`,
            ``,
            `  Reply ID    : ${signed.id.slice(0, 16)}…`,
            `  Original ID : ${input.event_id.slice(0, 16)}…`,
            `  Relay       : ${relayUrl}`,
            `  Mood        : ${mood}`,
            `  Language    : ${lang}`,
          ].join("\n"),
        }],
      };
    }
  );
}
