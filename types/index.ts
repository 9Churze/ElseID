// ============================================================
// ElseID — Global Type Definitions
// ============================================================

// ── Nostr ────────────────────────────────────────────────────

/** Nostr Event kind for digital drifters */
export const DRIFTER_KIND = 7777 as const;

/** A signed Nostr event (kind: 7777) */
export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

/** Unsigned event payload before signing */
export interface UnsignedEvent {
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
}

// ── Drifter ──────────────────────────────────────────────────

export type DrifterStatus = "roaming" | "resting" | "returned" | "abandoned";

/** Input payload for creating a digital drifter */
export interface DrifterInput {
  name: string;
  personality: string; // Amalgamated string (e.g., "like night&obsessed with coffee")
}

/** A digital drifter profile */
export interface Drifter {
  id: string;
  pubkey: string;
  /** @deprecated Private key is now stored exclusively in the identities table. */
  privkey?: string;
  name: string;
  personality: string;
  trait?: string;
  tags: string[];
  relay: string;
  departedAt: number;
  status: DrifterStatus;
  abandonedAt?: number;
  lastSeenAt?: number;
  lastSeenLoc?: string;
}

// ── Feeding ──────────────────────────────────────────────────

export type FeedType = "story" | "food" | "place" | "other";

/** Interaction with a drifter */
export interface Feeding {
  id: string;
  drifterId: string;
  feederPubkey: string;
  feederName?: string;
  feedType: FeedType;
  content: string;
  locationCountry?: string;
  locationCity?: string;
  fedAt: number;
  thankedAt?: number;
  relay: string;
}

// ── Hosting ──────────────────────────────────────────────────

export interface HostingLog {
  id: string;
  drifterId: string;
  drifterPubkey: string;
  drifterName?: string;
  arrivedAt: number;
  feedId?: string;
  sentOffAt?: number;
}

// ── Location ─────────────────────────────────────────────────

/** Coarse location — never includes precise coordinates */
export interface FuzzyLocation {
  country: string;   // ISO 3166-1 alpha-2, e.g. "JP"
  city: string;      // e.g. "Tokyo"
  /** Truncated to 1 decimal place — city-level only */
  lat: string;
  lon: string;
}

// ── Relay ────────────────────────────────────────────────────

export interface RelayInfo {
  url: string;
  online: boolean;
  latencyMs: number | null;
  writable: boolean;
  region?: string;
}

// ── Identity ─────────────────────────────────────────────────

export interface Identity {
  pubkey: string;
  privkey: string;
  createdAt: number;
  activeDrifterId: string | null;
  hostName: string | null;
}

// ── AI ───────────────────────────────────────────────────────

export interface ModerationResult {
  passed: boolean;
  reason?: string;
}

export interface PersonalityAnalysis {
  trait: string;
  tags: string[];
}
