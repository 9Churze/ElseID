// ============================================================
// ElseID — Default Relay Configuration
// ============================================================
/**
 * Verified Nostr relays based on real-world connectivity tests (v0.2.1).
 * Optimized for low latency and high reliability.
 */
const DEFAULT_URLS = [
    "wss://nos.lol",
    "wss://relay.damus.io",
    "wss://bitcoiner.social",
    "wss://nostr.mom",
    "wss://relay.nostr.band",
    "wss://relay.snort.social",
    "wss://nostr.fmt.wiz.biz",
];
const envRelays = process.env.ELSEID_RELAYS ? process.env.ELSEID_RELAYS.split(",").map(u => u.trim()).filter(Boolean) : [];
const ALL_URLS = [...new Set([...envRelays, ...DEFAULT_URLS])];
const GLOBAL_RELAYS = ALL_URLS.map(url => {
    let region = "Global";
    if (url.includes(".mom"))
        region = "ASIA";
    if (url.includes(".social") || url.includes(".biz"))
        region = "EU"; // rough guess
    return { url, region, writable: true };
});
/**
 * Detect user's language environment and sort relays accordingly.
 */
function getLocalizedRelays() {
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
//# sourceMappingURL=relays.js.map