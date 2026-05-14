// ElseID — src/nostr/filter.ts
// Builds Nostr REQ subscription filters for drifters and feedings.

import { DRIFTER_KIND } from "../../types/index.js";
import crypto from "node:crypto";

export interface NostrFilter {
  kinds:  number[];
  limit?: number;
  since?: number;
  until?: number;
  /** Tag filters: #<tag_name>: [values] */
  [key: `#${string}`]: string[] | undefined;
}

export function buildDrifterFilter(limit = 20): NostrFilter {
  return {
    kinds: [DRIFTER_KIND],
    limit,
    "#type": ["drifter"],
  };
}

export function buildFeedingFilter(drifterId: string, limit = 50): NostrFilter {
  return {
    kinds:  [DRIFTER_KIND],
    limit,
    "#e":   [drifterId],
    "#type": ["feeding"],
  };
}

export function newSubId(): string {
  return crypto.randomBytes(8).toString("hex");
}
