// ElseID — src/tools/recover_drifter.ts
// MCP Tool: Recover an orphaned drifter from the network.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPrimaryIdentity, setActiveDrifter } from "../storage/identity.js";
import { subscribeMany } from "../nostr/ws_pool.js";
import { DEFAULT_RELAYS } from "../../config/relays.js";
import { DRIFTER_KIND } from "../../types/index.js";
import { getTag } from "../nostr/event_builder.js";
import { getDrifter, saveDrifterLineage, saveMyDrifter } from "../storage/drifters.js";
import { sanitizeDisplayText, sanitizeName } from "../utils/text.js";

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
      if (identity.activeDrifterId) {
        return {
          content: [{ type: "text", text: "🛑 You already have an active drifter under your guidance. Recovery is only for lost local links." }],
          isError: true,
        };
      }
      
      // Scan relays for drifter events by this pubkey
      const relayUrls = DEFAULT_RELAYS.map(r => r.url);
      const filter = {
        kinds: [DRIFTER_KIND],
        authors: [identity.pubkey],
        "#type": ["drifter"],
        limit: 5
      } as any;

      const remoteEvents = await subscribeMany(relayUrls, filter);
      const candidates = input.drifter_id
        ? remoteEvents.filter(item => item.event.id === input.drifter_id)
        : remoteEvents;
      
      if (candidates.length === 0) {
        return {
          content: [{ type: "text", text: input.drifter_id
            ? "🏮 The specified soul imprint could not be found in this sector."
            : "🏮 The signal is weak. No soul imprint belonging to you was sensed in this sector." }],
        };
      }

      // Filter for ones not currently marked active in DB
      const orphaned = candidates.filter(item => item.event.id !== identity.activeDrifterId);

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
          name: sanitizeName(getTag(event.tags, "name"), "Recovered Drifter"),
          personality: sanitizeDisplayText(getTag(event.tags, "personality") || event.content, 1000),
          trait: sanitizeDisplayText(getTag(event.tags, "trait") || "Unknown", 120),
          tags: event.tags.filter(([k]) => k === "t").map(([, v]) => sanitizeDisplayText(v, 40)).filter(Boolean),
          relay: picked.relay,
          departedAt: event.created_at,
          status: "roaming",
        });
        const parentId = getTag(event.tags, "evolved_from");
        if (parentId && /^[0-9a-f]{64}$/i.test(parentId)) {
          await saveDrifterLineage(parentId, event.id, "recovered lineage", event.created_at);
        }
      }

      // Set it as active
      await setActiveDrifter(event.id);

      return {
        content: [{
          type: "text",
          text: `✨ Soul retrieved.\n\nSuccessfully found and synchronized the signal for drifter 「${sanitizeName(getTag(event.tags, "name"), "Unknown")}」.\n` +
                `It is currently at ${picked.relay}, waiting for your next instruction.`
        }],
      };
    }
  );
}
