// ============================================================
// Bicean — src/tools/create_drifter.ts
// MCP Tool: Create and launch a digital drifter.
// ============================================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getFuzzyLocation } from "../location/geo.js";
import { getPrimaryIdentity, setActiveDrifter } from "../storage/identity.js";
import { buildDrifterEvent } from "../nostr/event_builder.js";
import { signEvent } from "../nostr/event_signer.js";
import { pickRelayByGeo } from "../relay/selector.js";
import { broadcast } from "../relay/broadcaster.js";
import { saveMyDrifter } from "../storage/drifters.ts";
import { analyzePersonality, generateDepartureMessage } from "../ai/intelligence.js";

const schema = z.object({
  name: z.string().describe("Name of your digital drifter"),
  personality: z.string().describe("Personality description (use & to separate traits)"),
});

export function registerCreateDrifter(server: McpServer) {
  server.tool(
    "create_drifter",
    "Create and launch your digital drifter. You can only have one active drifter at a time.",
    schema.shape,
    async (input) => {
      const identity = getPrimaryIdentity();
      if (identity.activeDrifterId) {
        return {
          content: [{ type: "text", text: "❌ Your drifter is already on a journey. Abandon it first if you want to start fresh." }],
          isError: true,
        };
      }

      const [location, analysis] = await Promise.all([
        getFuzzyLocation(),
        analyzePersonality(input.personality),
      ]);

      const departureMsg = generateDepartureMessage(input.name, input.personality);
      
      const unsigned = buildDrifterEvent({
        pubkey: identity.pubkey,
        name: input.name,
        personality: input.personality,
        analysis,
        location,
        content: departureMsg,
      });

      const signed = signEvent(unsigned, identity.privkey);
      const relayUrl = pickRelayByGeo(location);
      const result = await broadcast(signed, relayUrl);

      if (!result.success) {
        return {
          content: [{ type: "text", text: `⚠️ Launch failed: ${result.message}` }],
          isError: true,
        };
      }

      saveMyDrifter({
        id: signed.id,
        pubkey: signed.pubkey,
        privkey: identity.privkey,
        name: input.name,
        personality: input.personality,
        mood: analysis.mood,
        tags: analysis.tags,
        relay: relayUrl,
        departedAt: signed.created_at,
        status: "roaming",
      });

      setActiveDrifter(signed.id);

      return {
        content: [{
          type: "text",
          text: `🚀 Your digital drifter 「${input.name}」 has departed!\n\n` +
                `Journey ID: ${signed.id}\n` +
                `Relay: ${relayUrl}\n` +
                `Departure: "${departureMsg}"`
        }],
      };
    }
  );
}
