// ============================================================
// Bicean — src/tools/send_bottle.ts
// MCP Tool: send an anonymous drift bottle.
// Orchestrates: moderation → emotion → location → sign → broadcast → persist
// ============================================================

import { McpServer }           from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }                   from "zod";
import { checkContent }        from "../ai/moderator.js";
import { analyzeEmotion }      from "../ai/emotion.js";
import { detectLanguage }      from "../ai/language.js";
import { getFuzzyLocation }    from "../location/geo.js";
import { getSessionIdentity }  from "../storage/identity.js";
import { buildDriftEvent }     from "../nostr/event_builder.js";
import { signEvent }           from "../nostr/event_signer.js";
import { pickRelay }           from "../relay/selector.js";
import { broadcast }           from "../relay/broadcaster.js";
import { saveBottle }          from "../storage/bottles.js";
import type { BottleInput }    from "../../types/index.js";

const schema = z.object({
  content:   z.string().min(1).max(2000).describe("Bottle text content"),
  mood:      z.enum(["lonely","happy","anxious","tired","hopeful","confused","calm"]).optional(),
  lang:      z.enum(["zh","en","ja","ko"]).optional(),
  ttl:       z.union([z.literal(3600), z.literal(86400), z.literal(604800), z.literal(0)])
               .optional()
               .describe("Time-to-live in seconds: 3600=1h, 86400=24h, 604800=7d, 0=forever"),
  tags:      z.array(z.string().max(30)).max(10).optional(),
  ephemeral: z.boolean().optional().describe("Burn-after-read mode"),
  relay:     z.string().url().optional().describe("Preferred relay URL; auto-selected if omitted"),
  anonymity: z.enum(["full","ephemeral","persistent"]).optional()
               .describe("Identity level: full=new key every send, ephemeral=session key, persistent=fixed key"),
});

export function registerSendBottle(server: McpServer) {
  server.tool(
    "send_bottle",
    "Send an anonymous drift bottle to the Nostr network. IMPORTANT: Before calling this tool, you MUST explain the 3 anonymity levels (Full/Ephemeral/Persistent) to the user and ask for their preference. Full means they cannot receive replies, while Ephemeral/Persistent allows it.",
    schema.shape,
    async (input) => {
      // ── 1. Moderation ────────────────────────────────────────
      const modResult = await checkContent(input.content);
      if (!modResult.passed) {
        return {
          content: [{
            type: "text",
            text: `❌ Content blocked: ${modResult.reason ?? "policy violation"}`,
          }],
        };
      }

      // ── 2. AI enrichment (parallel) ───────────────────────────
      const [emotion, detectedLang, location] = await Promise.all([
        analyzeEmotion(input.content),
        input.lang ? Promise.resolve(input.lang) : detectLanguage(input.content),
        getFuzzyLocation(),
      ]);

      const enrichedInput: BottleInput = {
        ...input,
        lang: input.lang ?? detectedLang,
      };

      // ── 3. Identity ───────────────────────────────────────────
      const level    = input.anonymity ?? "full";
      const identity = getSessionIdentity(level);

      // ── 4. Build event ────────────────────────────────────────
      const unsigned = buildDriftEvent({
        input:    enrichedInput,
        pubkey:   identity.pubkey,
        location,
        emotion,
      });

      // ── 5. Sign ───────────────────────────────────────────────
      const signed = signEvent(unsigned, identity.privkey);

      // ── 6. Pick relay + broadcast ──────────────────────────────
      const relayUrl = pickRelay(input.relay);
      const result   = await broadcast(signed, relayUrl);

      if (!result.success) {
        return {
          content: [{
            type: "text",
            text: `⚠️ Broadcast failed: ${result.message ?? "relay rejected event"}`,
          }],
        };
      }

      // ── 7. Persist locally ────────────────────────────────────
      saveBottle(signed, relayUrl);

      // ── 8. Response ───────────────────────────────────────────
      const ttlLabel = ttlToLabel(enrichedInput.ttl ?? 86400);
      return {
        content: [{
          type: "text",
          text: [
            `🌊 Bottle sent successfully`,
            ``,
            `  Event ID : ${signed.id.slice(0, 16)}…`,
            `  Relay    : ${relayUrl}`,
            `  Mood     : ${emotion.mood}  (${emotion.tone})`,
            `  Language : ${enrichedInput.lang}`,
            `  Location : ${location.city}, ${location.country}`,
            `  TTL      : ${ttlLabel}`,
            `  Tags     : ${emotion.tags.join(", ") || "—"}`,
          ].join("\n"),
        }],
      };
    }
  );
}

function ttlToLabel(ttl: number): string {
  if (ttl === 0)      return "forever";
  if (ttl === 3600)   return "1 hour";
  if (ttl === 86400)  return "24 hours";
  if (ttl === 604800) return "7 days";
  return `${ttl}s`;
}
