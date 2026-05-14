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
  await db.run(`
    UPDATE identities SET is_creating = ? WHERE pubkey = ?
  `, [locked ? 1 : 0, identity.pubkey]);
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
  const row = await db.get(`SELECT is_creating FROM identities LIMIT 1`) as { is_creating: number } | undefined;
  return !!row?.is_creating;
}

// Re-exports for tool layer

export {
  getPrimaryIdentity,
  setActiveDrifter,
  rotateIdentity,
};
