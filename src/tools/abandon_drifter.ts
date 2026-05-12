// ============================================================
// ElseID — src/tools/abandon_drifter.ts
// MCP Tool: Abandon the current ElseID and start fresh.
// ============================================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPrimaryIdentity, setActiveDrifter, rotateIdentity } from "../storage/identity.js";
import { buildDeletionEvent } from "../nostr/event_builder.js";
import { signEvent } from "../nostr/event_signer.js";
import { broadcast } from "../relay/broadcaster.js";
import { getMyActiveDrifter, updateDrifterStatus } from "../storage/drifters.js";

const schema = z.object({
  confirm: z.boolean().describe("Must be true to confirm abandonment"),
});

export function registerAbandonDrifter(server: McpServer) {
  server.tool(
    "abandon_drifter",
    "Abandon your current digital drifter and rotate your identity. This is a permanent action.",
    schema.shape,
    async (input) => {
      if (!input.confirm) {
        return {
          content: [{ type: "text", text: "⚠️ Abandonment cancelled. You must set confirm=true to proceed." }],
        };
      }

      const drifter = getMyActiveDrifter();
      if (!drifter) {
        return {
          content: [{ type: "text", text: "❌ You don't have an active drifter to abandon." }],
          isError: true,
        };
      }

      const identity = getPrimaryIdentity();
      
      // 1. Send NIP-09 deletion request
      const deletionEvent = buildDeletionEvent(identity.pubkey, [drifter.id], "User decided to start fresh.");
      const signedDeletion = signEvent(deletionEvent, identity.privkey);
      await broadcast(signedDeletion, drifter.relay);

      // 2. Update local storage: mark drifter as abandoned
      updateDrifterStatus(drifter.id, "abandoned", Math.floor(Date.now() / 1000));

      // 3. Explicitly clear active_drifter_id before rotation to close the
      //    timing window where getMyActiveDrifter() could still resolve.
      setActiveDrifter(null);

      // 4. Rotate identity (fresh start + key shredding)
      rotateIdentity();

      return {
        content: [{
          type: "text",
          text: `🌌 Your past self 「${drifter.name}」 has been abandoned. A new journey awaits you.`
        }],
      };
    }
  );
}
