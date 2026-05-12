// ============================================================
// ElseID — src/storage/identity.ts
// Identity management layer for Digital Drifters.
// ============================================================

import {
  getPrimaryIdentity,
  setActiveDrifter,
  rotateIdentity,
  exportKeypair,
  importKeypair,
} from "../crypto/keypair.js";

/**
 * Get the current active drifter ID for the primary identity.
 */
export function getActiveDrifterId(): string | null {
  return getPrimaryIdentity().activeDrifterId;
}

/**
 * Set the creation lock to prevent concurrent creation.
 */
export function setCreationLock(locked: boolean): void {
  const identity = getPrimaryIdentity();
  getDb().prepare(`
    UPDATE identities SET is_creating = ? WHERE pubkey = ?
  `).run(locked ? 1 : 0, identity.pubkey);
}

/**
 * Check if the creation lock is active.
 */
export function isCreating(): boolean {
  const row = getDb().prepare(`SELECT is_creating FROM identities LIMIT 1`).get() as { is_creating: number } | undefined;
  return !!row?.is_creating;
}

// ── Re-exports for tool layer ─────────────────────────────────

export {
  getPrimaryIdentity,
  setActiveDrifter,
  rotateIdentity,
  exportKeypair,
  importKeypair,
};
