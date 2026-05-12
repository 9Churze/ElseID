// ============================================================
// Bicean — src/nostr/filter.ts
// Builds Nostr REQ subscription filters for drifters and feedings.
// ============================================================

import { DRIFTER_KIND } from "../../types/index.js";

export interface NostrFilter {
  kinds:  number[];
  limit?: number;
  since?: number;
  until?: number;
  /** Tag filters: #<tag_name>: [values] */
  [key: `#${string}`]: string[] | undefined;
}

/**
 * Build a filter to find drifters.
 */
export function buildDrifterFilter(limit = 20): NostrFilter {
  return {
    kinds: [DRIFTER_KIND],
    limit,
    "#type": ["drifter"],
  };
}

/**
 * Build a filter to fetch feedings for a specific drifter.
 */
export function buildFeedingFilter(drifterId: string, limit = 50): NostrFilter {
  return {
    kinds:  [DRIFTER_KIND],
    limit,
    "#e":   [drifterId],
    "#type": ["feeding"],
  };
}

/**
 * Generate a random subscription ID for REQ messages.
 */
export function newSubId(): string {
  return Math.random().toString(36).slice(2, 10);
}
