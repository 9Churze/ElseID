// ============================================================
// Bicean — src/nostr/event_signer.ts
// Signs unsigned Nostr events locally using secp256k1 Schnorr.
// No private key ever leaves the local process.
// ============================================================

import { finalizeEvent, verifyEvent } from "nostr-tools";
import { hexToBytes }                  from "@noble/hashes/utils";
import type { UnsignedEvent, NostrEvent } from "../../types/index.js";

/**
 * Sign an unsigned Nostr event with the given hex private key.
 * Uses nostr-tools' finalizeEvent which:
 *   1. Serializes the event canonically
 *   2. SHA-256 hashes it → event.id
 *   3. Signs with Schnorr (secp256k1) → event.sig
 *
 * @throws if the private key is invalid or signing fails
 */
export function signEvent(
  unsignedEvent: UnsignedEvent,
  privkeyHex: string
): NostrEvent {
  if (!/^[0-9a-f]{64}$/i.test(privkeyHex)) {
    throw new Error("signEvent: privkey must be 64-char lowercase hex");
  }

  const secretBytes = hexToBytes(privkeyHex.toLowerCase());

  // finalizeEvent mutates and returns the event with id + sig populated
  const signed = finalizeEvent(
    {
      kind:       unsignedEvent.kind,
      created_at: unsignedEvent.created_at,
      tags:       unsignedEvent.tags,
      content:    unsignedEvent.content,
    },
    secretBytes
  );

  return signed as NostrEvent;
}

/**
 * Verify the id and Schnorr signature of a Nostr event.
 * Use before accepting any fetched event from a relay.
 */
export function verifySignature(event: NostrEvent): boolean {
  try {
    return verifyEvent(event as Parameters<typeof verifyEvent>[0]);
  } catch {
    return false;
  }
}

/**
 * Serialize a Nostr event to the canonical JSON wire format
 * (array form used for ID computation). Useful for debugging.
 */
export function serializeEvent(event: UnsignedEvent): string {
  return JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content,
  ]);
}
