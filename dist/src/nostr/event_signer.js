// ElseID — src/nostr/event_signer.ts
// Signs unsigned Nostr events locally using secp256k1 Schnorr.
// No private key ever leaves the local process.
import { finalizeEvent, verifyEvent } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils.js";
export function signEvent(unsignedEvent, privkeyHex) {
    if (!/^[0-9a-f]{64}$/i.test(privkeyHex)) {
        throw new Error("signEvent: privkey must be 64-char lowercase hex");
    }
    const secretBytes = hexToBytes(privkeyHex.toLowerCase());
    // finalizeEvent mutates and returns the event with id + sig populated
    const signed = finalizeEvent({
        kind: unsignedEvent.kind,
        created_at: unsignedEvent.created_at,
        tags: unsignedEvent.tags,
        content: unsignedEvent.content,
    }, secretBytes);
    return signed;
}
export function verifySignature(event) {
    try {
        return verifyEvent(event);
    }
    catch {
        return false;
    }
}
export function serializeEvent(event) {
    return JSON.stringify([
        0,
        event.pubkey,
        event.created_at,
        event.kind,
        event.tags,
        event.content,
    ]);
}
//# sourceMappingURL=event_signer.js.map