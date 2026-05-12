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

// ── Re-exports for tool layer ─────────────────────────────────

export {
  getPrimaryIdentity,
  setActiveDrifter,
  rotateIdentity,
  exportKeypair,
  importKeypair,
};
