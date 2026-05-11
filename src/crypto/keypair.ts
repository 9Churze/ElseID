// ============================================================
// Bicean — src/crypto/keypair.ts
// secp256k1 keypair generation, local storage, identity mgmt.
// Private keys are stored ONLY on the local device.
// ============================================================

import { generateSecretKey, getPublicKey } from "nostr-tools";
import { bytesToHex, hexToBytes }           from "@noble/hashes/utils";
import { getDb }                            from "../storage/db.js";
import type { Identity, AnonymityLevel }   from "../../types/index.js";

// ── Internal helpers ─────────────────────────────────────────

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

function newKeypair(): { privkey: string; pubkey: string } {
  const secretBytes = generateSecretKey();       // Uint8Array (32 bytes)
  const privkey     = bytesToHex(secretBytes);
  const pubkey      = getPublicKey(secretBytes); // hex pubkey
  return { privkey, pubkey };
}

// ── Public API ───────────────────────────────────────────────

/**
 * Create a brand-new identity and persist it to the local DB.
 */
export function createIdentity(level: AnonymityLevel): Identity {
  const { privkey, pubkey } = newKeypair();
  const identity: Identity  = { level, pubkey, privkey, createdAt: nowSec() };

  getDb().prepare(`
    INSERT OR IGNORE INTO identities (pubkey, privkey, level, created_at)
    VALUES (?, ?, ?, ?)
  `).run(identity.pubkey, identity.privkey, identity.level, identity.createdAt);

  return identity;
}

/**
 * Load the most recent persisted identity for the given level.
 */
export function loadIdentity(level: AnonymityLevel): Identity | null {
  const row = getDb().prepare(`
    SELECT pubkey, privkey, level, created_at
    FROM identities
    WHERE level = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(level) as { pubkey: string; privkey: string; level: string; created_at: number } | undefined;

  if (!row) return null;
  return {
    pubkey:    row.pubkey,
    privkey:   row.privkey,
    level:     row.level as AnonymityLevel,
    createdAt: row.created_at,
  };
}

/**
 * Get or create an identity according to anonymity level:
 *   full        → new ephemeral keypair every call (never persisted)
 *   ephemeral   → new keypair per first call, then reused in session
 *   persistent  → reuse the same keypair across all sessions
 */
export function getOrCreateIdentity(level: AnonymityLevel): Identity {
  if (level === "full") {
    // Fully anonymous: generate in memory, do NOT write to DB
    const { privkey, pubkey } = newKeypair();
    return { level, pubkey, privkey, createdAt: nowSec() };
  }
  return loadIdentity(level) ?? createIdentity(level);
}

/**
 * Delete a specific identity by pubkey.
 */
export function deleteIdentity(pubkey: string): void {
  getDb().prepare(`DELETE FROM identities WHERE pubkey = ?`).run(pubkey);
}

/**
 * List all stored identities (privkey omitted for safety).
 */
export function listIdentities(): Omit<Identity, "privkey">[] {
  const rows = getDb().prepare(`
    SELECT pubkey, level, created_at FROM identities ORDER BY created_at DESC
  `).all() as { pubkey: string; level: string; created_at: number }[];

  return rows.map((r) => ({
    pubkey:    r.pubkey,
    level:     r.level as AnonymityLevel,
    createdAt: r.created_at,
  }));
}

/**
 * Export keypair for backup. Caller must secure the output.
 */
export function exportKeypair(pubkey: string): { pubkey: string; privkey: string } | null {
  const row = getDb().prepare(`
    SELECT pubkey, privkey FROM identities WHERE pubkey = ?
  `).get(pubkey) as { pubkey: string; privkey: string } | undefined;

  return row ?? null;
}

/**
 * Import a keypair from backup (raw 64-char lowercase hex privkey).
 */
export function importKeypair(privkeyHex: string, level: AnonymityLevel): Identity {
  if (!/^[0-9a-f]{64}$/i.test(privkeyHex)) {
    throw new Error("Invalid private key: must be 64-char hex");
  }

  const secretBytes = hexToBytes(privkeyHex.toLowerCase());
  const pubkey      = getPublicKey(secretBytes);
  const identity: Identity = {
    level,
    pubkey,
    privkey: privkeyHex.toLowerCase(),
    createdAt: nowSec(),
  };

  getDb().prepare(`
    INSERT OR REPLACE INTO identities (pubkey, privkey, level, created_at)
    VALUES (?, ?, ?, ?)
  `).run(identity.pubkey, identity.privkey, identity.level, identity.createdAt);

  return identity;
}
