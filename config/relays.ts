// ============================================================
// Bicean — Default Relay Configuration
// ============================================================

export interface RelayConfig {
  url: string;
  region: string;
  writable: boolean;
}

/** Public Nostr relays used as default candidates */
export const DEFAULT_RELAYS: RelayConfig[] = [
  { url: "wss://relay.damus.io",       region: "US",  writable: true },
  { url: "wss://nos.lol",              region: "US",  writable: true },
  { url: "wss://relay.nostr.band",     region: "EU",  writable: true },
  { url: "wss://nostr.fmt.wiz.biz",    region: "US",  writable: true },
  { url: "wss://relay.snort.social",   region: "EU",  writable: true },
  { url: "wss://nostr-pub.wellorder.net", region: "EU", writable: true },
  { url: "wss://nostr.wine",           region: "EU",  writable: false },
];

/** Maximum bottles fetched per REQ */
export const FETCH_LIMIT = 50;

/** WebSocket connection timeout (ms) */
export const WS_TIMEOUT_MS = 5_000;

/** Health check interval (ms) */
export const HEALTH_CHECK_INTERVAL_MS = 60_000;
