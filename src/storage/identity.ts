// ============================================================
// Bicean — src/storage/identity.ts
// Anonymous identity management layer (above keypair.ts).
// Provides session-scoped ephemeral identity caching.
// ============================================================

import {
  getOrCreateIdentity,
  createIdentity,
  loadIdentity,
  listIdentities,
  deleteIdentity,
  exportKeypair,
  importKeypair,
} from "../crypto/keypair.js";
import type { Identity, AnonymityLevel } from "../../types/index.js";

// ── Session cache ─────────────────────────────────────────────
// For "ephemeral" level, reuse the same keypair within a process lifetime
// (across multiple send_bottle calls in the same MCP session).

let _sessionIdentity: Identity | null = null;

export function getSessionIdentity(level: AnonymityLevel): Identity {
  if (level === "full") {
    // Always fresh, never cached
    return getOrCreateIdentity("full");
  }

  if (level === "ephemeral") {
    if (!_sessionIdentity) {
      _sessionIdentity = getOrCreateIdentity("ephemeral");
    }
    return _sessionIdentity;
  }

  // persistent — load from DB or create once
  return getOrCreateIdentity("persistent");
}

/**
 * Force a new ephemeral identity for the current session.
 * Call this if the user wants to "start fresh" without restarting.
 */
export function rotateEphemeralIdentity(): Identity {
  _sessionIdentity = createIdentity("ephemeral");
  return _sessionIdentity;
}

// ── Re-exports for tool layer ─────────────────────────────────

export {
  listIdentities,
  deleteIdentity,
  exportKeypair,
  importKeypair,
  loadIdentity,
};
