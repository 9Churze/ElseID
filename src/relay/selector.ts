// ============================================================
// Bicean — src/relay/selector.ts
// Geographic-prioritized relay selection strategy.
// ============================================================

import { getHealthyRelays } from "./health.js";
import { DEFAULT_RELAYS }   from "../../config/relays.js";
import type { RelayInfo, FuzzyLocation } from "../../types/index.js";

/**
 * Pick the best relay for a drifter based on geographic proximity.
 */
export function pickRelayByGeo(location: FuzzyLocation): string {
  const healthy = getHealthyRelays();
  
  // 1. Try to find a relay in the same country/region
  const regionMatch = healthy.find(r => r.region === location.country);
  if (regionMatch) return regionMatch.url;

  // 2. Fall back to weighted random pick (latency-based)
  return pickRelay();
}

/**
 * Pick the single best relay for sending a new drifter (fallback strategy).
 */
export function pickRelay(preferredUrl?: string): string {
  const healthy = getHealthyRelays();

  if (preferredUrl) {
    const match = healthy.find((r) => r.url === preferredUrl);
    if (match) return match.url;
  }

  if (healthy.length === 0) {
    const fallback = DEFAULT_RELAYS.find((r) => r.writable);
    return fallback?.url ?? DEFAULT_RELAYS[0].url;
  }

  const weighted = healthy.map((r) => ({
    url:    r.url,
    weight: 1 / ((r.latencyMs ?? 500) + 100),
  }));

  const total = weighted.reduce((s, r) => s + r.weight, 0);
  let   rand  = Math.random() * total;

  for (const entry of weighted) { rand -= entry.weight; if (rand <= 0) return entry.url; }
  return weighted[0].url;
}

/**
 * For find_nearby_drifter: prioritize relays in the same country/region.
 */
export function pickRelaysForFetch(location: FuzzyLocation, count = 3): string[] {
  const healthy = getHealthyRelays();

  // Sort healthy relays: matches country/region first, then others
  const sorted = [...healthy].sort((a, b) => {
    const aMatch = a.region === location.country ? 0 : 1;
    const bMatch = b.region === location.country ? 0 : 1;
    return aMatch - bMatch;
  });

  return sorted.map(r => r.url).slice(0, count);
}
