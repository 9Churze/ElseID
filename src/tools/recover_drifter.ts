// ============================================================
// ElseID — src/tools/recover_drifter.ts
// MCP Tool: Recover an orphaned drifter from the network.
// ============================================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPrimaryIdentity, setActiveDrifter } from "../storage/identity.js";
import { subscribeMany } from "../nostr/ws_pool.js";
import { DEFAULT_RELAYS } from "../../config/relays.js";
import { DRIFTER_KIND } from "../../types/index.js";
import { getTag } from "../nostr/event_builder.js";
import { saveMyDrifter, getDrifter } from "../storage/drifters.js";

const schema = z.object({
  drifter_id: z.string().optional().describe("Specific ID to recover (if known)"),
});

export function registerRecoverDrifter(server: McpServer) {
  server.tool(
    "recover_drifter",
    "寻回漂流在外的数字信号。当管家感应到你有失控的分身时使用。",
    schema.shape,
    async (input) => {
      const identity = getPrimaryIdentity();
      
      // 1. Scan relays for drifter events by this pubkey
      const relayUrls = DEFAULT_RELAYS.map(r => r.url);
      const filter = {
        kinds: [DRIFTER_KIND],
        authors: [identity.pubkey],
        "#type": ["drifter"],
        limit: 5
      } as any;

      const remoteEvents = await subscribeMany(relayUrls, filter);
      
      if (remoteEvents.length === 0) {
        return {
          content: [{ type: "text", text: "🏮 信号微弱，没有在这片星域感应到属于你的灵魂印记。" }],
        };
      }

      // Filter for ones not currently marked active in DB
      const orphaned = remoteEvents.filter(item => item.event.id !== identity.activeDrifterId);

      if (orphaned.length === 0) {
        return {
          content: [{ type: "text", text: "✅ 所有的分身都在你的指引之下，没有迷失的信号。" }],
        };
      }

      // Pick the most recent orphaned drifter
      const picked = orphaned[0];
      const event = picked.event;

      // If we don't have it in local DB, reconstruct it
      const local = getDrifter(event.id);
      if (!local) {
        saveMyDrifter({
          id: event.id,
          pubkey: event.pubkey,
          name: getTag(event.tags, "name") || "寻回的分身",
          personality: getTag(event.tags, "personality") || event.content,
          trait: getTag(event.tags, "trait") || "未知",
          tags: event.tags.filter(([k]) => k === "t").map(([, v]) => v),
          relay: picked.relay,
          departedAt: event.created_at,
          status: "roaming",
        });
      }

      // Set it as active
      setActiveDrifter(event.id);

      return {
        content: [{
          type: "text",
          text: `✨ 灵魂归位。\n\n已成功找回并同步分身 「${getTag(event.tags, "name") || "未知"}」 的信号。\n` +
                `它正停留在 ${picked.relay}，等待你的下一步指令。`
        }],
      };
    }
  );
}
