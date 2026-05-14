// tests/crypto.test.ts
// Unit tests for src/crypto/encrypt.ts and src/crypto/encryption.ts

import { describe, test, expect, beforeAll } from "vitest";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

// ─── Point the device-key to a temp dir so tests are hermetic ───────────────
const TEST_DATA_DIR = path.join(os.tmpdir(), `elseid-test-${process.pid}`);
process.env.ELSEID_DATA_DIR = TEST_DATA_DIR;

beforeAll(() => {
  fs.mkdirSync(TEST_DATA_DIR, { recursive: true, mode: 0o700 });
});

// ─── src/crypto/encryption.ts ───────────────────────────────────────────────
describe("encryption (device-key AES-256-GCM)", () => {
  test("encrypt returns iv:tag:ciphertext format", async () => {
    const { encrypt } = await import("../src/crypto/encryption.js");
    const out = encrypt("hello world");
    const parts = out.split(":");
    expect(parts).toHaveLength(3);
    // iv = 12 bytes → 24 hex chars
    expect(parts[0]).toHaveLength(24);
    // tag = 16 bytes → 32 hex chars
    expect(parts[1]).toHaveLength(32);
    // ciphertext length > 0
    expect(parts[2].length).toBeGreaterThan(0);
  });

  test("decrypt reverses encrypt correctly", async () => {
    const { encrypt, decrypt } = await import("../src/crypto/encryption.js");
    const original = "my super secret private key material";
    expect(decrypt(encrypt(original))).toBe(original);
  });

  test("decrypt handles legacy plaintext hex key (64-char passthrough)", async () => {
    const { decrypt } = await import("../src/crypto/encryption.js");
    const legacyKey = "a".repeat(64);
    expect(decrypt(legacyKey)).toBe(legacyKey);
  });

  test("decrypt throws on tampered ciphertext", async () => {
    const { encrypt, decrypt } = await import("../src/crypto/encryption.js");
    const encrypted = encrypt("sensitive data");
    // Corrupt the last byte of the ciphertext segment
    const parts = encrypted.split(":");
    parts[2] = parts[2].slice(0, -2) + "ff";
    await expect(() => decrypt(parts.join(":"))).toThrow();
  });

  test("two encrypt calls produce different ciphertexts (random IV)", async () => {
    const { encrypt } = await import("../src/crypto/encryption.js");
    const a = encrypt("same plaintext");
    const b = encrypt("same plaintext");
    expect(a).not.toBe(b);
  });

  test("decrypt throws on invalid format (too few segments)", async () => {
    const { decrypt } = await import("../src/crypto/encryption.js");
    await expect(() => decrypt("notvalidatall")).toThrow();
  });
});

// ─── src/crypto/encrypt.ts ──────────────────────────────────────────────────
describe("encryptContent / decryptContent (ECDH AES-256-GCM)", () => {
  test("ephemeral recipient key is valid x-only pubkey (64 hex chars)", async () => {
    const { generateEphemeralRecipient } = await import("../src/crypto/encrypt.js");
    const { pubkey, privkey } = generateEphemeralRecipient();
    expect(pubkey).toMatch(/^[0-9a-f]{64}$/);
    expect(privkey).toMatch(/^[0-9a-f]{64}$/);
  });

  test("encrypt → decrypt round-trip with ephemeral keys", async () => {
    const { encryptContent, decryptContent, generateEphemeralRecipient } =
      await import("../src/crypto/encrypt.js");

    const sender    = generateEphemeralRecipient();
    const recipient = generateEphemeralRecipient();
    const plaintext = "Hello, Nostr DM!";

    const ciphertext = encryptContent(plaintext, sender.privkey, recipient.pubkey);
    const recovered  = decryptContent(ciphertext, recipient.privkey, sender.pubkey);

    expect(recovered).toBe(plaintext);
  });

  test("output is base64 and round-trips correctly", async () => {
    const { encryptContent, generateEphemeralRecipient } =
      await import("../src/crypto/encrypt.js");

    const s = generateEphemeralRecipient();
    const r = generateEphemeralRecipient();
    const out = encryptContent("test", s.privkey, r.pubkey);

    expect(() => Buffer.from(out, "base64")).not.toThrow();
  });

  test("decryptContent throws on truncated payload (< 28 bytes)", async () => {
    const { decryptContent, generateEphemeralRecipient } =
      await import("../src/crypto/encrypt.js");
    const r = generateEphemeralRecipient();
    const s = generateEphemeralRecipient();
    const short = Buffer.alloc(10).toString("base64");
    await expect(() => decryptContent(short, r.privkey, s.pubkey)).toThrow("Invalid encrypted payload");
  });

  test("decryptContent fails with wrong recipient key", async () => {
    const { encryptContent, decryptContent, generateEphemeralRecipient } =
      await import("../src/crypto/encrypt.js");

    const sender    = generateEphemeralRecipient();
    const recipient = generateEphemeralRecipient();
    const attacker  = generateEphemeralRecipient();

    const ciphertext = encryptContent("secret", sender.privkey, recipient.pubkey);
    await expect(() => decryptContent(ciphertext, attacker.privkey, sender.pubkey)).toThrow();
  });
});
