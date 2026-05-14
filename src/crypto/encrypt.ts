// ElseID — src/crypto/encrypt.ts
// Secure encryption for burn-after-read bottles.
// Uses AES-256-GCM with ECDH shared secret (secp256k1).
// Note: This is an improvement over NIP-04 which uses CBC without authentication.

import { getSharedSecret, getPublicKey } from "@noble/secp256k1";
import { bytesToHex, hexToBytes, randomBytes } from "@noble/hashes/utils.js";
import { sha256 }     from "@noble/hashes/sha2.js";
import { createCipheriv, createDecipheriv } from "node:crypto";

// Shared secret derivation (same as NIP-04 for compatibility in key derivation)
function deriveSharedSecret(privkeyHex: string, pubkeyHex: string): Buffer {
  const pubkeyBytes =
    pubkeyHex.length === 64
      ? hexToBytes("02" + pubkeyHex)
      : hexToBytes(pubkeyHex);

  const shared = getSharedSecret(hexToBytes(privkeyHex), pubkeyBytes);
  return Buffer.from(sha256(shared.slice(1, 33)));
}

/**
 * Encrypts content using AES-256-GCM.
 * Output format: base64(iv + tag + ciphertext)
 */
export function encryptContent(
  plaintext:    string,
  senderPrivHex: string,
  recipientPubHex: string
): string {
  const key = deriveSharedSecret(senderPrivHex, recipientPubHex);
  const iv  = randomBytes(12); // GCM standard IV size

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(plaintext, "utf8")),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Combine IV + Tag + Ciphertext
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/**
 * Decrypts content using AES-256-GCM.
 */
export function decryptContent(
  combinedB64: string,
  recipientPrivHex: string,
  senderPubHex:     string
): string {
  const combined = Buffer.from(combinedB64, "base64");
  if (combined.length < 28) { // 12 (IV) + 16 (Tag) + at least 0 (Ciphertext)
    throw new Error("Invalid encrypted payload");
  }

  const iv = combined.subarray(0, 12);
  const tag = combined.subarray(12, 28);
  const ciphertext = combined.subarray(28);

  const key = deriveSharedSecret(recipientPrivHex, senderPubHex);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function generateEphemeralRecipient(): { pubkey: string; privkey: string } {
  const privBytes = randomBytes(32);
  const privkey   = bytesToHex(privBytes);
  const pubkeyFull = getPublicKey(privBytes, true);
  const pubkey    = bytesToHex(pubkeyFull.slice(1)); // x-only

  return { pubkey, privkey };
}
