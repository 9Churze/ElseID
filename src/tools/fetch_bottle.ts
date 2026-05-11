// ============================================================
// Bicean — src/tools/fetch_bottle.ts
// MCP Tool: randomly fetch drift bottles from the relay network.
// Orchestrates: relay selection → WS subscribe → rank → return
// ============================================================

import { McpServer }            from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }                    from "zod";
import { buildFilter }          from "../nostr/filter.js";
import { subscribeMany }        from "../nostr/ws_pool.js";
import { rankBottles }          from "../ai/matcher.js";
import { pickRelaysForFetch }   from "../relay/selector.js";
import { saveBottle }           from "../storage/bottles.js";
import { getTag, getAllTags }   from "../nostr/event_builder.js";
import type { Bottle, NostrEvent, Mood, SupportedLang, TTLOption, FuzzyLocation } from "../../types/index.js";

const schema = z.object({
  mood:  z.enum(["lonely","happy","anxious","tired","hopeful","confused","calm"]).optional()
           .describe("Filter or bias results by mood"),
  lang:  z.enum(["zh","en","ja","ko"]).optional()
           .describe("Filter by language"),
  since: z.number().int().positive().optional()
           .describe("Unix timestamp — only fetch bottles newer than this"),
  until: z.number().int().positive().optional()
           .describe("Unix timestamp — only fetch bottles older than this"),
  limit: z.number().int().min(1).max(20).default(5)
           .describe("Number of bottles to return (1–20, default 5)"),
});

export function registerFetchBottle(server: McpServer) {
  server.tool(
    "fetch_bottle",
    "Pick up random drift bottles from the Nostr relay network",
    schema.shape,
    async (input) => {
      // ── 1. Build filter ───────────────────────────────────────
      const filter = buildFilter({
        mood:  input.mood,
        lang:  input.lang,
        since: input.since,
        until: input.until,
        limit: Math.min((input.limit ?? 5) * 4, 80), // over-fetch for ranking
      });

      // ── 2. Pick relays + subscribe ────────────────────────────
      const relayUrls = pickRelaysForFetch(3);
      const events    = await subscribeMany(relayUrls, filter);

      if (events.length === 0) {
        return {
          content: [{
            type: "text",
            text: "🌊 The ocean is quiet… no bottles found matching your filter. Try again or remove filters.",
          }],
        };
      }

      // ── 3. Rank + slice ───────────────────────────────────────
      const ranked = rankBottles(events, { mood: input.mood, lang: input.lang });
      const picked = ranked.slice(0, input.limit ?? 5);

      // ── 4. Persist locally (for reply tracking) ───────────────
      for (const event of picked) {
        // We don't know which specific relay returned this event,
        // so we store the first relay in our list as the source.
        saveBottle(event, relayUrls[0] ?? "unknown");
      }

      // ── 5. Format response ────────────────────────────────────
      const formatted = picked.map((event, i) => formatBottle(event, i + 1)).join("\n\n---\n\n");

      return {
        content: [{
          type: "text",
          text: `🌊 Found ${picked.length} bottle${picked.length > 1 ? "s" : ""} drifting in from ${relayUrls.length} relay${relayUrls.length > 1 ? "s" : ""}:\n\n${formatted}`,
        }],
      };
    }
  );
}

// ── Formatting ────────────────────────────────────────────────

function formatBottle(event: NostrEvent, index: number): string {
  const tags    = event.tags;
  const mood    = getTag(tags, "mood")    ?? "—";
  const tone    = getTag(tags, "tone")    ?? "";
  const lang    = getTag(tags, "lang")    ?? "—";
  const country = getTag(tags, "country") ?? "";
  const city    = getTag(tags, "city")    ?? "";
  const ttlRaw  = getTag(tags, "ttl");
  const topicTags = getAllTags(tags, "t");
  const encrypted = getTag(tags, "encrypted") === "true";

  const age      = formatAge(event.created_at);
  const location = [city, country].filter(Boolean).join(", ") || "Unknown";
  const ttlLabel = ttlRaw ? ttlToLabel(parseInt(ttlRaw, 10)) : "24h";

  const lines = [
    `📦 Bottle #${index}  [${event.id.slice(0, 12)}…]`,
    ``,
    encrypted
      ? `🔒 This bottle is encrypted (burn-after-read)`
      : `"${event.content}"`,
    ``,
    `  🎭 Mood     : ${mood}${tone ? `  (${tone})` : ""}`,
    `  🌐 Language : ${lang}`,
    `  📍 From     : ${location}`,
    `  🕐 Sent     : ${age}`,
    `  ⏳ TTL      : ${ttlLabel}`,
  ];

  if (topicTags.length > 0) {
    lines.push(`  🏷️  Tags     : ${topicTags.join(", ")}`);
  }

  lines.push(`  🔑 Reply ID : ${event.id}`);

  return lines.join("\n");
}

function formatAge(createdAt: number): string {
  const sec = Math.floor(Date.now() / 1000) - createdAt;
  if (sec < 60)   return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function ttlToLabel(ttl: number): string {
  if (ttl === 0)      return "forever";
  if (ttl === 3600)   return "1 hour";
  if (ttl === 86400)  return "24 hours";
  if (ttl === 604800) return "7 days";
  return `${ttl}s`;
}
