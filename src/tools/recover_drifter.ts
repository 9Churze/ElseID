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
    "Recover wandering digital signals. Use this when the Butler senses you have a lost or orphaned drifter.",
    schema.shape,
    async (input) => {
      const identity = await getPrimaryIdentity();
      
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
          content: [{ type: "text", text: "🏮 The signal is weak. No soul imprint belonging to you was sensed in this sector." }],
        };
      }

      // Filter for ones not currently marked active in DB
      const orphaned = remoteEvents.filter(item => item.event.id !== identity.activeDrifterId);

      if (orphaned.length === 0) {
        return {
          content: [{ type: "text", text: "✅ All drifters are under your guidance. No lost signals found." }],
        };
      }

      // Pick the most recent orphaned drifter
      const picked = orphaned[0];
      const event = picked.event;

      // If we don't have it in local DB, reconstruct it
      const local = await getDrifter(event.id);
      if (!local) {
        await saveMyDrifter({
          id: event.id,
          pubkey: event.pubkey,
          name: getTag(event.tags, "name") || "Recovered Drifter",
          personality: getTag(event.tags, "personality") || event.content,
          trait: getTag(event.tags, "trait") || "Unknown",
          tags: event.tags.filter(([k]) => k === "t").map(([, v]) => v),
          relay: picked.relay,
          departedAt: event.created_at,
          status: "roaming",
        });
      }

      // Set it as active
      await setActiveDrifter(event.id);

      return {
        content: [{
          type: "text",
          text: `✨ Soul retrieved.\n\nSuccessfully found and synchronized the signal for drifter 「${getTag(event.tags, "name") || "Unknown"}」.\n` +
                `It is currently at ${picked.relay}, waiting for your next instruction.`
        }],
      };
    }
  );
}
