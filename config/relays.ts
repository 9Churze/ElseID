// ============================================================
// ElseID — Default Relay Configuration
// ============================================================

export interface RelayConfig {
  url: string;
  region: string;
  writable: boolean;
}

/**
 * Verified Nostr relays based on real-world connectivity tests (v0.2.1).
 * Optimized for low latency and high reliability.
 */
const GLOBAL_RELAYS: RelayConfig[] = [
  // ── Verified & Fast (Class A) ──────────────────────────────
  { url: "wss://nos.lol",              region: "Global", writable: true },
  { url: "wss://relay.damus.io",       region: "Global", writable: true },
  { url: "wss://bitcoiner.social",     region: "EU",     writable: true },
  { url: "wss://nostr.mom",            region: "ASIA",   writable: true },
  
  // ── Reliable Fallbacks (Class B) ───────────────────────────
  { url: "wss://relay.nostr.band",     region: "Global", writable: true },
  { url: "wss://relay.snort.social",   region: "EU",     writable: true },
  { url: "wss://nostr.fmt.wiz.biz",    region: "US",     writable: true },
];

/**
 * Detect user's language environment and sort relays accordingly.
 */
function getLocalizedRelays(): RelayConfig[] {
  const lang = (process.env.LANG || process.env.LANGUAGE || "").toLowerCase();
  const isChinese = lang.includes("zh") || lang.includes("cn");

  if (isChinese) {
    // Prioritize ASIA/Global nodes for Chinese users
    return [...GLOBAL_RELAYS].sort((a, b) => {
      const aScore = (a.region === "ASIA" ? 2 : (a.region === "Global" ? 1 : 0));
      const bScore = (b.region === "ASIA" ? 2 : (b.region === "Global" ? 1 : 0));
      return bScore - aScore;
    });
  }
  return GLOBAL_RELAYS;
}

/** Final list of default relays based on environment check */
export const DEFAULT_RELAYS = getLocalizedRelays();

/** Maximum events fetched per REQ */
export const FETCH_LIMIT = 50;

/** WebSocket connection timeout (ms) */
export const WS_TIMEOUT_MS = 8_000; // Increased for proxy environments

/** Health check interval (ms) */
export const HEALTH_CHECK_INTERVAL_MS = 60_000;
