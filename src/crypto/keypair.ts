// ============================================================
// ElseID — src/crypto/keypair.ts
// secp256k1 keypair generation, local storage, identity mgmt.
// Private keys are stored ONLY on the local device.
// ============================================================

import { generateSecretKey, getPublicKey } from "nostr-tools";
import { bytesToHex, hexToBytes }           from "@noble/hashes/utils.js";
import { getDb }                            from "../storage/db.js";
import type { Identity }                    from "../../types/index.js";

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
 * Get the current primary identity, or create one if none exists.
 */
export function getPrimaryIdentity(): Identity {
  const row = getDb().prepare(`
    SELECT pubkey, privkey, created_at, active_drifter_id
    FROM identities
    LIMIT 1
  `).get() as { pubkey: string; privkey: string; created_at: number; active_drifter_id: string | null } | undefined;

  if (row) {
    return {
      pubkey:    row.pubkey,
      privkey:   row.privkey,
      createdAt: row.created_at,
      activeDrifterId: row.active_drifter_id,
    };
  }

  // Create new
  const { privkey, pubkey } = newKeypair();
  const identity: Identity  = { pubkey, privkey, createdAt: nowSec(), activeDrifterId: null };

  getDb().prepare(`
    INSERT INTO identities (pubkey, privkey, created_at, active_drifter_id)
    VALUES (?, ?, ?, ?)
  `).run(identity.pubkey, identity.privkey, identity.createdAt, identity.activeDrifterId);

  return identity;
}

/**
 * Set the active drifter ID for the primary identity.
 */
export function setActiveDrifter(drifterId: string | null): void {
  const identity = getPrimaryIdentity();
  getDb().prepare(`
    UPDATE identities SET active_drifter_id = ? WHERE pubkey = ?
  `).run(drifterId, identity.pubkey);
}

/**
 * Rotate the identity: create a brand-new primary keypair.
 * Used when abandoning a drifter to ensure a fresh start.
 */
export function rotateIdentity(): Identity {
  // Clear old identities to maintain "single-identity" model
  getDb().prepare(`DELETE FROM identities`).run();
  
  const { privkey, pubkey } = newKeypair();
  const identity: Identity  = { pubkey, privkey, createdAt: nowSec(), activeDrifterId: null };

  getDb().prepare(`
    INSERT INTO identities (pubkey, privkey, created_at, active_drifter_id)
    VALUES (?, ?, ?, ?)
  `).run(identity.pubkey, identity.privkey, identity.createdAt, identity.activeDrifterId);

  return identity;
}

/**
 * Export keypair for backup.
 */
export function exportKeypair(): { pubkey: string; privkey: string } | null {
  const identity = getPrimaryIdentity();
  return { pubkey: identity.pubkey, privkey: identity.privkey };
}

/**
 * Import a keypair from backup.
 */
export function importKeypair(privkeyHex: string): Identity {
  if (!/^[0-9a-f]{64}$/i.test(privkeyHex)) {
    throw new Error("Invalid private key: must be 64-char hex");
  }

  const secretBytes = hexToBytes(privkeyHex.toLowerCase());
  const pubkey      = getPublicKey(secretBytes);
  
  // Clear old
  getDb().prepare(`DELETE FROM identities`).run();

  const identity: Identity = {
    pubkey,
    privkey: privkeyHex.toLowerCase(),
    createdAt: nowSec(),
    activeDrifterId: null,
  };

  getDb().prepare(`
    INSERT INTO identities (pubkey, privkey, created_at, active_drifter_id)
    VALUES (?, ?, ?, ?)
  `).run(identity.pubkey, identity.privkey, identity.createdAt, identity.activeDrifterId);

  return identity;
}
