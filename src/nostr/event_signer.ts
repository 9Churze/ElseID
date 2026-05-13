// ElseID — src/nostr/event_signer.ts
// Signs unsigned Nostr events locally using secp256k1 Schnorr.
// No private key ever leaves the local process.

import { finalizeEvent, verifyEvent } from "nostr-tools";
import { hexToBytes }                  from "@noble/hashes/utils.js";
import type { UnsignedEvent, NostrEvent } from "../../types/index.js";

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

export function verifySignature(event: NostrEvent): boolean {
  try {
    return verifyEvent(event as Parameters<typeof verifyEvent>[0]);
  } catch {
    return false;
  }
}

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
