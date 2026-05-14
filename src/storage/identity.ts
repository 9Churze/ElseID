// ElseID — src/storage/identity.ts
// Identity management layer for Digital Drifters.

import {
  getPrimaryIdentity,
  setActiveDrifter,
  rotateIdentity,
} from "../crypto/keypair.js";
import { getDb } from "./db.js";
import { sanitizeName } from "../utils/text.js";

export async function getActiveDrifterId(): Promise<string | null> {
  const identity = await getPrimaryIdentity();
  return identity.activeDrifterId;
}

export async function setCreationLock(locked: boolean): Promise<void> {
  const identity = await getPrimaryIdentity();
  const db = getDb();
  const now = locked ? Math.floor(Date.now() / 1000) : null;
  await db.run(`
    UPDATE identities SET is_creating = ?, creating_at = ? WHERE pubkey = ?
  `, [locked ? 1 : 0, now, identity.pubkey]);
}

export async function setHostName(name: string): Promise<void> {
  const identity = await getPrimaryIdentity();
  const db = getDb();
  const safeName = sanitizeName(name, "Host");
  await db.run(`
    UPDATE identities SET host_name = ? WHERE pubkey = ?
  `, [safeName, identity.pubkey]);
}

export async function isCreating(): Promise<boolean> {
  const db = getDb();
  const row = await db.get(`SELECT is_creating, creating_at FROM identities LIMIT 1`) as { is_creating: number; creating_at: number | null } | undefined;
  
  if (!row?.is_creating) return false;

  // Stale lock check (10 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (row.creating_at && (now - row.creating_at > 600)) {
    // Force unlock
    await db.run(`UPDATE identities SET is_creating = 0, creating_at = NULL`);
    return false;
  }

  return true;
}

// Re-exports for tool layer

export {
  getPrimaryIdentity,
  setActiveDrifter,
  rotateIdentity,
};
