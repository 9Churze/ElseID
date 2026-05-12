// ============================================================
// ElseID — src/tools/create_drifter.ts
// MCP Tool: Create and launch an ElseID drifter.
// ============================================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getFuzzyLocation } from "../location/geo.js";
import { getPrimaryIdentity, setActiveDrifter, isCreating, setCreationLock } from "../storage/identity.js";
import { buildDrifterEvent } from "../nostr/event_builder.js";
import { signEvent } from "../nostr/event_signer.js";
import { pickRelayByGeo } from "../relay/selector.js";
import { broadcast } from "../relay/broadcaster.js";
import { saveMyDrifter } from "../storage/drifters.js";

const schema = z.object({
  name: z.string().describe("Name of your ElseID drifter"),
  personality: z.string().describe("Full personality description/quote"),
  trait: z.string().describe("Primary identity trait extracted by the Butler"),
  tags: z.array(z.string()).describe("List of personality tags extracted by the Butler"),
});

export function registerCreateDrifter(server: McpServer) {
  server.tool(
    "create_drifter",
    "Create and launch your ElseID drifter. As the Butler, you are responsible for extracting the core trait and personality tags from the user's description before calling this tool.",
    schema.shape,
    async (input) => {
      const identity = getPrimaryIdentity();
      
      // 1. Check for existing drifter or active lock
      if (identity.activeDrifterId || isCreating()) {
        return {
          content: [{ type: "text", text: "❌ You already have a drifter on a journey or in the process of launching. Please wait." }],
          isError: true,
        };
      }

      // 2. Lock creation process
      setCreationLock(true);

      try {
        const location = await getFuzzyLocation();
        
        const unsigned = buildDrifterEvent({
          pubkey: identity.pubkey,
          name: input.name,
          personality: input.personality,
          analysis: {
            trait: input.trait,
            tags: input.tags,
          },
          location,
          content: input.personality,
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
          name: input.name,
          personality: input.personality,
          trait: input.trait,
          tags: input.tags,
          relay: relayUrl,
          departedAt: signed.created_at,
          status: "roaming",
        });

        setActiveDrifter(signed.id);

        return {
          content: [{
            type: "text",
            text: `🚀 ElseID launched successfully!\n\n「${input.name}」 has set sail and is entering the wandering network...\n\n` +
                  `📍 Initial Relay: ${relayUrl}\n` +
                  `🌊 Status: Looking for the first person to host it.`
          }],
        };
      } finally {
        // 3. Unlock creation process
        setCreationLock(false);
      }
    }
  );
}
