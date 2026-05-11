// ============================================================
// Bicean — src/tools/delete_bottle.ts
// MCP Tool: recall a drift bottle you sent.
//
// Flow:
//   1. Look up bottle in local DB — verify user is the sender
//   2. Build NIP-09 kind:5 deletion event
//   3. Sign with the same identity pubkey that sent the bottle
//   4. Broadcast to the same relay
//   5. Soft-delete locally (hidden from all queries)
//
// Nostr caveat: Relays are NOT required to honour kind:5.
// We make best effort and always delete locally regardless.
// ============================================================

import { McpServer }         from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }                  from "zod";
import { getDb }              from "../storage/db.js";
import { signEvent }          from "../nostr/event_signer.js";
import { broadcast }          from "../relay/broadcaster.js";
import {
  getBottle,
  getSentBottlePubkey,
  getBottleRelay,
  softDeleteBottle,
} from "../storage/bottles.js";
import type { Identity, AnonymityLevel } from "../../types/index.js";

// ── Schema ────────────────────────────────────────────────────

const schema = z.object({
  event_id: z
    .string()
    .length(64)
    .describe("Hex event ID of the bottle you want to recall (from the Event ID / Reply ID field)"),
});

// ── Tool registration ─────────────────────────────────────────

export function registerDeleteBottle(server: McpServer) {
  server.tool(
    "delete_bottle",
    "Recall a drift bottle you sent. Sends a NIP-09 deletion request to the relay and removes it locally.",
    schema.shape,
    async ({ event_id }) => {

      // ── 1. Validate event ID format ───────────────────────────
      if (!/^[0-9a-f]{64}$/i.test(event_id)) {
        return {
          content: [{ type: "text", text: "❌ Invalid event ID. Must be 64-char hex." }],
        };
      }

      // ── 2. Check bottle exists locally ────────────────────────
      const bottle = getBottle(event_id);
      if (!bottle) {
        return {
          content: [{
            type: "text",
            text: "❌ Bottle not found in local records.\nYou can only recall bottles that were sent from this device.",
          }],
        };
      }

      // ── 3. Verify this user is the sender ─────────────────────
      const senderPubkey = getSentBottlePubkey(event_id);
      if (!senderPubkey) {
        return {
          content: [{
            type: "text",
            text: "❌ This bottle was received from the network, not sent by you.\nYou can only recall your own bottles.",
          }],
        };
      }

      // ── 4. Load the matching private key ─────────────────────
      // full-anonymous bottles use a one-time key that is never stored
      const identity =
        loadIdentityByPubkey(senderPubkey, "persistent") ??
        loadIdentityByPubkey(senderPubkey, "ephemeral");

      if (!identity) {
        softDeleteBottle(event_id); // still hide it locally
        return {
          content: [{
            type: "text",
            text: [
              "⚠️  Cannot send relay deletion request.",
              "",
              "This bottle was sent in full-anonymous mode, which generates a",
              "one-time key that is never stored. Without the original signing",
              "key, a valid NIP-09 request cannot be created.",
              "",
              "✅ The bottle has been hidden from your local view.",
            ].join("\n"),
          }],
        };
      }

      // ── 5. Build NIP-09 kind:5 deletion event ────────────────
      // kind:5 is standard Nostr — separate from DRIFT_BOTTLE_KIND (7777)
      const deletionEvent = {
        pubkey:     senderPubkey,
        created_at: Math.floor(Date.now() / 1000),
        kind:       5 as number,
        tags: [
          ["e", event_id],   // event to delete
          ["k", "7777"],     // kind of the target event
        ],
        content: "drift bottle recalled",
      };

      // ── 6. Sign ───────────────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const signed = signEvent(deletionEvent as any, identity.privkey);

      // ── 7. Broadcast to original relay ────────────────────────
      const relayUrl = getBottleRelay(event_id) ?? bottle.relay;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result   = await broadcast(signed as any, relayUrl);

      // ── 8. Soft-delete locally (unconditional) ────────────────
      softDeleteBottle(event_id);

      // ── 9. Response ───────────────────────────────────────────
      const relayLine = result.success
        ? "✅ Relay accepted the deletion request"
        : `⚠️  Relay did not confirm (${result.message ?? "no response"})`;

      return {
        content: [{
          type: "text",
          text: [
            "🗑️  Bottle recalled",
            "",
            `  Event ID : ${event_id.slice(0, 16)}...`,
            `  Relay    : ${relayUrl}`,
            `  Relay    : ${relayLine}`,
            "  Local    : ✅ Hidden from your device",
            "",
            "Note: Nostr relays are not required to honour NIP-09 deletion.",
            "If the bottle was already read or synced elsewhere, it may",
            "persist on other nodes. Local deletion is always guaranteed.",
          ].join("\n"),
        }],
      };
    }
  );
}

// ── Helper ────────────────────────────────────────────────────

/**
 * Look up a stored identity by exact pubkey + level.
 * Used to recover the signing key for NIP-09 deletion.
 */
function loadIdentityByPubkey(
  pubkey: string,
  level:  AnonymityLevel
): Identity | null {
  const row = getDb().prepare(`
    SELECT pubkey, privkey, level, created_at
    FROM identities
    WHERE pubkey = ? AND level = ?
  `).get(pubkey, level) as {
    pubkey: string; privkey: string; level: string; created_at: number;
  } | undefined;

  if (!row) return null;

  return {
    pubkey:    row.pubkey,
    privkey:   row.privkey,
    level:     row.level as AnonymityLevel,
    createdAt: row.created_at,
  };
}
