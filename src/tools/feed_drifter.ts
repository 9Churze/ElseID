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
    "接待并投喂一个路过的 ElseID 分身。你的投喂将被写入对方的流浪轨迹。",
    schema.shape,
    async (input) => {
      const moderation = await checkContent(input.content);
      if (!moderation.passed) {
        return {
          content: [{ type: "text", text: `🚫 内容审核未通过: ${moderation.reason}` }],
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
          content: [{ type: "text", text: `⚠️ 投喂失败: ${result.message}` }],
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
          text: `🍱 投喂完成。\n\n你分享的内容已经写入对方的 Journey Log。\n` +
                `它将在下一次流浪时，带着你的善意继续前行。\n\n` +
                `感谢你愿意接待一个陌生人的另一种人生。`
        }],
      };
    }
  );
}
