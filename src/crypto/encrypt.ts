// ElseID — src/crypto/encrypt.ts
// NIP-04 compatible encryption for burn-after-read bottles.
// Uses AES-256-CBC with ECDH shared secret (secp256k1).

import { getSharedSecret, getPublicKey } from "@noble/secp256k1";
import { bytesToHex, hexToBytes, randomBytes } from "@noble/hashes/utils.js";
import { sha256 }     from "@noble/hashes/sha256.js";
import { createCipheriv, createDecipheriv } from "crypto";

// Shared secret derivation

function deriveSharedSecret(privkeyHex: string, pubkeyHex: string): Buffer {
  // Ensure the pubkey is the full 33-byte compressed form
  const pubkeyBytes =
    pubkeyHex.length === 64
      ? hexToBytes("02" + pubkeyHex) // x-only → compressed
      : hexToBytes(pubkeyHex);

  const shared = getSharedSecret(hexToBytes(privkeyHex), pubkeyBytes);
  // NIP-04: use only the x-coordinate (first 32 bytes, skip leading 0x02)
  return Buffer.from(sha256(shared.slice(1, 33)));
}

// Encrypt

export interface EncryptedPayload {
  /** base64-encoded ciphertext */
  ciphertext: string;
  /** base64-encoded 16-byte IV */
  iv: string;
}

export function encryptContent(
  plaintext:    string,
  senderPrivHex: string,
  recipientPubHex: string
): string {
  const key = deriveSharedSecret(senderPrivHex, recipientPubHex);
  const iv  = randomBytes(16);

  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(plaintext, "utf8")),
    cipher.final(),
  ]);

  const ct = encrypted.toString("base64");
  const ivB64 = Buffer.from(iv).toString("base64");

  return `${ct}?iv=${ivB64}`;
}

export function decryptContent(
  ciphertextWithIv: string,
  recipientPrivHex: string,
  senderPubHex:     string
): string {
  const [ctB64, ivPart] = ciphertextWithIv.split("?iv=");
  if (!ctB64 || !ivPart) {
    throw new Error("Malformed encrypted payload");
  }

  const key        = deriveSharedSecret(recipientPrivHex, senderPubHex);
  const iv         = Buffer.from(ivPart, "base64");
  const ciphertext = Buffer.from(ctB64, "base64");

  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

// Ephemeral key for burn-after-read

export function generateEphemeralRecipient(): { pubkey: string; privkey: string } {
  const privBytes = randomBytes(32);
  const privkey   = bytesToHex(privBytes);
  const pubkeyFull = getPublicKey(privBytes, true); // compressed (using bytes directly for v3)
  const pubkey    = bytesToHex(pubkeyFull.slice(1)); // x-only

  return { pubkey, privkey };
}
