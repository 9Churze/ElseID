// ============================================================
// Bicean — src/relay/selector.ts
// Single-broadcast relay selection strategy.
// One bottle → one relay. Preserves the "drift" feeling.
// ============================================================

import { getHealthyRelays } from "./health.js";
import { DEFAULT_RELAYS }   from "../../config/relays.js";
import type { RelayInfo }   from "../../types/index.js";

/**
 * Pick the single best relay for sending a new drift bottle.
 *
 * Strategy (in priority order):
 *   1. If the caller specifies a URL, validate it's writable and return it.
 *   2. From online+writable relays, prefer lowest latency.
 *   3. Add a small random jitter so bottles naturally spread across relays
 *      (prevents all bottles always landing on relay #1).
 *   4. If nothing is healthy, fall back to the first default relay.
 *
 * @param preferredUrl  Optional relay URL requested by the user.
 */
export function pickRelay(preferredUrl?: string): string {
  const healthy = getHealthyRelays();

  // 1. Honour explicit preference if the relay is writable
  if (preferredUrl) {
    const match = healthy.find((r) => r.url === preferredUrl);
    if (match) return match.url;
    // Warn but don't block — we'll pick the best available
    console.warn(`[selector] Preferred relay ${preferredUrl} not in healthy list, ignoring.`);
  }

  // 2. No healthy relays at all → fallback
  if (healthy.length === 0) {
    const fallback = DEFAULT_RELAYS.find((r) => r.writable);
    return fallback?.url ?? DEFAULT_RELAYS[0].url;
  }

  // 3. Weighted random pick biased toward low-latency relays.
  //    Weight = 1 / (latency_ms + 100) so even null-latency relays get weight 1/100.
  const weighted = healthy.map((r) => ({
    url:    r.url,
    weight: 1 / ((r.latencyMs ?? 500) + 100),
  }));

  const total = weighted.reduce((s, r) => s + r.weight, 0);
  let   rand  = Math.random() * total;

  for (const entry of weighted) {
    rand -= entry.weight;
    if (rand <= 0) return entry.url;
  }

  // Fallback (floating-point edge case)
  return weighted[0].url;
}

/**
 * For fetch_bottle: return a shuffled list of all healthy relays
 * so the user gets bottles from different sources.
 */
export function pickRelaysForFetch(count = 3): string[] {
  const healthy = getHealthyRelays();

  // Fisher-Yates shuffle
  const arr = [...healthy.map((r) => r.url)];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.slice(0, count);
}
