// ElseID — src/crypto/keypair.ts
// secp256k1 keypair generation, local storage, identity mgmt.
// Private keys are stored ONLY on the local device.

import { generateSecretKey, getPublicKey } from "nostr-tools";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { getDb } from "../storage/db.js";
import type { Identity } from "../../types/index.js";

// Internal helpers

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

function newKeypair(): { privkey: string; pubkey: string } {
  const secretBytes = generateSecretKey();
  const privkey = bytesToHex(secretBytes);
  const pubkey = getPublicKey(secretBytes);
  return { privkey, pubkey };
}

// Public API

export async function getPrimaryIdentity(): Promise<Identity> {
  const db = getDb();
  const row = await db.get(`
    SELECT pubkey, privkey, created_at, active_drifter_id
    FROM identities
    LIMIT 1
  `) as { pubkey: string; privkey: string; created_at: number; active_drifter_id: string | null } | undefined;

  if (row) {
    return {
      pubkey: row.pubkey,
      privkey: row.privkey,
      createdAt: row.created_at,
      activeDrifterId: row.active_drifter_id,
    };
  }

  // Create new
  const { privkey, pubkey } = newKeypair();
  const identity: Identity = { pubkey, privkey, createdAt: nowSec(), activeDrifterId: null };

  await db.run(`
    INSERT INTO identities (pubkey, privkey, created_at, active_drifter_id)
    VALUES (?, ?, ?, ?)
  `, [identity.pubkey, identity.privkey, identity.createdAt, identity.activeDrifterId]);

  return identity;
}

export async function setActiveDrifter(drifterId: string | null): Promise<void> {
  const db = getDb();
  const identity = await getPrimaryIdentity();
  await db.run(`
    UPDATE identities SET active_drifter_id = ? WHERE pubkey = ?
  `, [drifterId, identity.pubkey]);
}

export async function rotateIdentity(): Promise<Identity> {
  const db = getDb();
  // Shred the old private key in-place
  const scrub = bytesToHex(generateSecretKey());
  await db.run(`UPDATE identities SET privkey = ?`, [scrub]);

  // Delete the now-worthless row
  await db.run(`DELETE FROM identities`);

  // Insert fresh identity
  const { privkey, pubkey } = newKeypair();
  const identity: Identity = { pubkey, privkey, createdAt: nowSec(), activeDrifterId: null };

  await db.run(`
    INSERT INTO identities (pubkey, privkey, created_at, active_drifter_id)
    VALUES (?, ?, ?, ?)
  `, [identity.pubkey, identity.privkey, identity.createdAt, identity.activeDrifterId]);

  // Checkpoint WAL
  try { await db.exec("PRAGMA wal_checkpoint(TRUNCATE)"); } catch { }

  return identity;
}

export async function exportKeypair(): Promise<{ pubkey: string; privkey: string } | null> {
  const identity = await getPrimaryIdentity();
  return { pubkey: identity.pubkey, privkey: identity.privkey };
}

export async function importKeypair(privkeyHex: string): Promise<Identity> {
  const db = getDb();
  if (!/^[0-9a-f]{64}$/i.test(privkeyHex)) {
    throw new Error("Invalid private key: must be 64-char hex");
  }

  const secretBytes = hexToBytes(privkeyHex.toLowerCase());
  const pubkey = getPublicKey(secretBytes);

  await db.run(`DELETE FROM identities`);

  const identity: Identity = {
    pubkey,
    privkey: privkeyHex.toLowerCase(),
    createdAt: nowSec(),
    activeDrifterId: null,
  };

  await db.run(`
    INSERT INTO identities (pubkey, privkey, created_at, active_drifter_id)
    VALUES (?, ?, ?, ?)
  `, [identity.pubkey, identity.privkey, identity.createdAt, identity.activeDrifterId]);

  return identity;
}
