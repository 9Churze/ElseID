// ElseID — src/tools/feed_drifter.ts
// MCP Tool: Feed an ElseID drifter with stories/food/places.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getFuzzyLocation } from "../location/geo.js";
import { getPrimaryIdentity } from "../storage/identity.js";
import { buildFeedingEvent } from "../nostr/event_builder.js";
import { signEvent } from "../nostr/event_signer.js";
import { broadcast } from "../relay/broadcaster.js";
import { saveOutgoingFeeding } from "../storage/drifters.js";
import { checkContent } from "../ai/moderator.js";
import { validateEncounter } from "../storage/encounters.js";
import { sanitizeDisplayText, sanitizeName } from "../utils/text.js";
import { sanitizeErrorMessage } from "../utils/errors.js";

const schema = z.object({
  drifter_event_id: z.string().regex(/^[0-9a-f]{64}$/i).describe("The ID of the drifter you are feeding"),
  drifter_name: z.string().max(80).optional().describe("The name of the drifter you are feeding"),
  encounter_token: z.string().regex(/^[0-9a-f]{32}$/i).describe("Short-lived encounter token returned by find_nearby_drifter"),
  feed_type: z.enum(["story", "food", "place", "other"]).describe("Type of feeding"),
  content: z.string().min(5).max(1000).describe("Your story, recommendation, or message"),
  relay: z.string().url().describe("The relay where the drifter was found"),
});

export function registerFeedDrifter(server: McpServer) {
  server.tool(
    "feed_drifter",
    "Host and feed a passing ElseID drifter. Your feeding will be written into the drifter's journey log.",
    schema.shape,
    async (input) => {
      if (!input.relay.startsWith("wss://")) {
        return {
          content: [{ type: "text", text: "🚫 Feeding failed: relay must be a secure Nostr WebSocket URL." }],
          isError: true,
        };
      }

      const validEncounter = await validateEncounter(input.encounter_token, input.drifter_event_id, input.relay);
      if (!validEncounter) {
        return {
          content: [{ type: "text", text: "🚫 Feeding failed: this encounter has expired or does not match the discovered drifter." }],
          isError: true,
        };
      }

      const moderation = await checkContent(input.content);
      if (!moderation.passed) {
        return {
          content: [{ type: "text", text: `🚫 Moderation failed: ${moderation.reason}` }],
          isError: true,
        };
      }

      const location = await getFuzzyLocation();
      const identity = await getPrimaryIdentity();
      const safeContent = sanitizeDisplayText(input.content, 1000);
      const safeDrifterName = input.drifter_name ? sanitizeName(input.drifter_name, "Unnamed Drifter") : undefined;

      const unsigned = buildFeedingEvent({
        pubkey: identity.pubkey,
        drifterEventId: input.drifter_event_id,
        feedType: input.feed_type,
        content: safeContent,
        location,
        hostName: identity.hostName,
      });

      const signed = signEvent(unsigned, identity.privkey);
      const result = await broadcast(signed, input.relay);

      if (!result.success) {
        return {
          content: [{ type: "text", text: `⚠️ Feeding failed: ${sanitizeErrorMessage(result.message)}` }],
          isError: true,
        };
      }

      await saveOutgoingFeeding({
        id: signed.id,
        drifterId: input.drifter_event_id,
        feederPubkey: identity.pubkey,
        feederName: identity.hostName ?? undefined,
        feedType: input.feed_type,
        content: safeContent,
        locationCountry: location.country,
        locationCity: location.city,
        fedAt: signed.created_at,
        relay: input.relay,
      }, safeDrifterName);

      return {
        content: [{
          type: "text",
          text: `🍱 Feeding complete.\n\nYour message has been written into the drifter's Journey Log.\n` +
                `It will carry your kindness as it continues its journey.\n\n` +
                `Thank you for hosting another person's alternative life.`
        }],
      };
    }
  );
}
