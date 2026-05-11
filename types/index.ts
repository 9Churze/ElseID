// ============================================================
// Bicean — Global Type Definitions
// ============================================================

// ── Nostr ────────────────────────────────────────────────────

/** Nostr Event kind for drift bottles */
export const DRIFT_BOTTLE_KIND = 7777 as const;

/** A signed Nostr event (kind: 7777) */
export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: typeof DRIFT_BOTTLE_KIND;
  tags: string[][];
  content: string;
  sig: string;
}

/** Unsigned event payload before signing */
export interface UnsignedEvent {
  pubkey: string;
  created_at: number;
  kind: typeof DRIFT_BOTTLE_KIND;
  tags: string[][];
  content: string;
}

// ── Bottle ───────────────────────────────────────────────────

export type Mood =
  | "lonely"
  | "happy"
  | "anxious"
  | "tired"
  | "hopeful"
  | "confused"
  | "calm";

export type SupportedLang = "zh" | "en" | "ja" | "ko";

export type TTLOption = 3600 | 86400 | 604800 | 0; // 1h | 24h | 7d | forever

/** Input payload for creating a drift bottle */
export interface BottleInput {
  content: string;
  mood?: Mood;
  lang?: SupportedLang;
  ttl?: TTLOption;
  tags?: string[];
  /** If true, encrypt content (burn-after-read mode) */
  ephemeral?: boolean;
  /** Target relay URL; if omitted, system picks one */
  relay?: string;
}

/** A fully resolved drift bottle (after fetching from relay) */
export interface Bottle {
  eventId: string;
  content: string;
  mood: Mood;
  tone?: string;
  lang: SupportedLang;
  tags: string[];
  ttl: TTLOption;
  createdAt: number;
  expiresAt: number | null;
  relay: string;
  location: FuzzyLocation;
  ephemeral: boolean;
  pubkey: string;
  isSent: boolean;
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

// ── Fetch filter ─────────────────────────────────────────────

export interface BottleFilter {
  mood?: Mood;
  lang?: SupportedLang;
  since?: number;    // unix timestamp
  until?: number;
  limit?: number;
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

export type AnonymityLevel = "full" | "ephemeral" | "persistent";

export interface Identity {
  level: AnonymityLevel;
  pubkey: string;
  /** private key — never transmitted */
  privkey: string;
  createdAt: number;
}

// ── AI ───────────────────────────────────────────────────────

export interface ModerationResult {
  passed: boolean;
  reason?: string;
}

export interface EmotionResult {
  mood: Mood;
  tone: string;
  tags: string[];
  confidence: number;
}

export interface MatchScore {
  eventId: string;
  score: number;
}
