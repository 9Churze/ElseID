// ============================================================
// ElseID — src/tools/feed_drifter.ts
// MCP Tool: Feed an ElseID drifter with stories/food/places.
// ============================================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getFuzzyLocation } from "../location/geo.js";
import { getPrimaryIdentity } from "../storage/identity.js";
import { buildFeedingEvent } from "../nostr/event_builder.js";
import { signEvent } from "../nostr/event_signer.js";
import { pickRelay } from "../relay/selector.js";
import { broadcast } from "../relay/broadcaster.js";
import { saveOutgoingFeeding } from "../storage/drifters.js";
import { checkContent } from "../ai/moderator.js";

const schema = z.object({
  drifter_event_id: z.string().describe("The ID of the drifter you are feeding"),
  feed_type: z.enum(["story", "food", "place", "other"]).describe("Type of feeding"),
  content: z.string().describe("Your story, recommendation, or message"),
  relay: z.string().url().describe("The relay where the drifter was found"),
});

export function registerFeedDrifter(server: McpServer) {
  server.tool(
    "feed_drifter",
    "Host and feed a passing ElseID drifter. Your feeding will be written into the drifter's journey log.",
    schema.shape,
    async (input) => {
      const moderation = await checkContent(input.content);
      if (!moderation.passed) {
        return {
          content: [{ type: "text", text: `🚫 Moderation failed: ${moderation.reason}` }],
          isError: true,
        };
      }

      const location = await getFuzzyLocation();
      const identity = getPrimaryIdentity();

      const unsigned = buildFeedingEvent({
        pubkey: identity.pubkey,
        drifterEventId: input.drifter_event_id,
        feedType: input.feed_type,
        content: input.content,
        location,
      });

      const signed = signEvent(unsigned, identity.privkey);
      const result = await broadcast(signed, input.relay);

      if (!result.success) {
        return {
          content: [{ type: "text", text: `⚠️ Feeding failed: ${result.message}` }],
          isError: true,
        };
      }

      saveOutgoingFeeding({
        id: signed.id,
        drifterId: input.drifter_event_id,
        feederPubkey: identity.pubkey,
        feedType: input.feed_type,
        content: input.content,
        locationCountry: location.country,
        locationCity: location.city,
        fedAt: signed.created_at,
        relay: input.relay,
      });

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
