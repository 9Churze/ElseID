// ============================================================
// Bicean — src/nostr/filter.ts
// Builds Nostr REQ subscription filters from BottleFilter.
// ============================================================

import { DRIFT_BOTTLE_KIND } from "../../types/index.js";
import type { BottleFilter }  from "../../types/index.js";

export interface NostrFilter {
  kinds:  number[];
  limit?: number;
  since?: number;
  until?: number;
  /** Tag filters: #<tag_name>: [values] */
  [key: `#${string}`]: string[] | undefined;
}

/**
 * Convert a BottleFilter into a Nostr REQ filter object.
 * The relay will match events where ALL specified conditions are true.
 */
export function buildFilter(filter: BottleFilter = {}): NostrFilter {
  const nostrFilter: NostrFilter = {
    kinds: [DRIFT_BOTTLE_KIND],
    limit: filter.limit ?? 20,
  };

  if (filter.since) nostrFilter.since = filter.since;
  if (filter.until) nostrFilter.until = filter.until;

  // Tag filter for mood: relays that support NIP-12 generic tag queries
  if (filter.mood) {
    nostrFilter["#mood"] = [filter.mood];
  }

  // Tag filter for language
  if (filter.lang) {
    nostrFilter["#lang"] = [filter.lang];
  }

  // Always filter to drift-type bottles only
  nostrFilter["#type"] = ["drift"];

  return nostrFilter;
}

/**
 * Build a filter to fetch replies to a specific bottle.
 */
export function buildReplyFilter(eventId: string, limit = 10): NostrFilter {
  return {
    kinds:  [DRIFT_BOTTLE_KIND],
    limit,
    "#e":   [eventId],
    "#type": ["drift-reply"],
  };
}

/**
 * Generate a random subscription ID for REQ messages.
 */
export function newSubId(): string {
  return Math.random().toString(36).slice(2, 10);
}
