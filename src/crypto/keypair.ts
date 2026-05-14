// ElseID — src/crypto/keypair.ts
// secp256k1 keypair generation, local storage, identity mgmt.
// Private keys are stored ONLY on the local device.

import { generateSecretKey, getPublicKey } from "nostr-tools";
import { bytesToHex } from "@noble/hashes/utils.js";
import { getDb } from "../storage/db.js";
import { encrypt, decrypt } from "./encryption.js";
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
    SELECT pubkey, privkey, created_at, active_drifter_id, host_name
    FROM identities
    LIMIT 1
  `) as { pubkey: string; privkey: string; created_at: number; active_drifter_id: string | null; host_name: string | null } | undefined;

  if (row) {
    return {
      pubkey: row.pubkey,
      privkey: decrypt(row.privkey),
      createdAt: row.created_at,
      activeDrifterId: row.active_drifter_id,
      hostName: row.host_name,
    };
  }

  // Create new
  const { privkey, pubkey } = newKeypair();
  const identity: Identity = { pubkey, privkey, createdAt: nowSec(), activeDrifterId: null, hostName: null };

  await db.run(`
    INSERT INTO identities (pubkey, privkey, created_at, active_drifter_id, host_name)
    VALUES (?, ?, ?, ?, ?)
  `, [identity.pubkey, encrypt(identity.privkey), identity.createdAt, identity.activeDrifterId, identity.hostName]);

  return identity;
}

export async function setActiveDrifter(drifterId: string | null): Promise<void> {
  const db = getDb();
  const identity = await getPrimaryIdentity();
  
  // Prevent race conditions where two drifters are set as active simultaneously
  if (drifterId && identity.activeDrifterId && identity.activeDrifterId !== drifterId) {
    throw new Error("Active identity collision: Another drifter is already under guidance.");
  }

  await db.run(`
    UPDATE identities SET active_drifter_id = ? WHERE pubkey = ?
  `, [drifterId, identity.pubkey]);
}

export async function rotateIdentity(): Promise<Identity> {
  const db = getDb();
  await db.exec("BEGIN IMMEDIATE");
  try {
    // Shred the old private key in-place with random data (encrypted)
  const scrub = encrypt(bytesToHex(generateSecretKey()));
  await db.run(`UPDATE identities SET privkey = ?`, [scrub]);

  // Delete the now-worthless row
  await db.run(`DELETE FROM identities`);

  // Insert fresh identity
  const { privkey, pubkey } = newKeypair();
  const identity: Identity = { pubkey, privkey, createdAt: nowSec(), activeDrifterId: null, hostName: null };

  await db.run(`
    INSERT INTO identities (pubkey, privkey, created_at, active_drifter_id, host_name)
    VALUES (?, ?, ?, ?, ?)
  `, [identity.pubkey, encrypt(identity.privkey), identity.createdAt, identity.activeDrifterId, identity.hostName]);

    // Checkpoint WAL
    try { await db.exec("PRAGMA wal_checkpoint(TRUNCATE)"); } catch { }

    await db.exec("COMMIT");
    return identity;
  } catch (err) {
    await db.exec("ROLLBACK").catch(() => { });
    throw err;
  }
}
