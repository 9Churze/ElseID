// ============================================================
// Bicean — src/ai/matcher.ts
// Drift bottle recommendation scoring.
// Ranks fetched events by mood affinity, language, recency.
// No external API calls — pure local scoring.
// ============================================================

import { getTag, getAllTags } from "../nostr/event_builder.js";
import type { NostrEvent, BottleFilter, Mood, SupportedLang } from "../../types/index.js";

// ── Mood affinity matrix ──────────────────────────────────────
// Score 0-3: how "compatible" two moods feel together.
// Symmetric is intentional — the bottle's mood is what matters.

const MOOD_AFFINITY: Record<Mood, Record<Mood, number>> = {
  lonely:  { lonely: 3, hopeful: 2, calm: 1, confused: 1, tired: 2, happy: 0, anxious: 1 },
  happy:   { happy: 3, hopeful: 2, calm: 2, lonely: 1, confused: 0, tired: 0, anxious: 0 },
  anxious: { anxious: 3, confused: 2, tired: 2, lonely: 1, hopeful: 1, calm: 1, happy: 0 },
  tired:   { tired: 3, lonely: 2, anxious: 2, calm: 2, confused: 1, hopeful: 1, happy: 0 },
  hopeful: { hopeful: 3, happy: 2, calm: 2, lonely: 1, confused: 1, tired: 1, anxious: 1 },
  confused:{ confused: 3, anxious: 2, lonely: 2, hopeful: 1, tired: 1, calm: 0, happy: 0 },
  calm:    { calm: 3, happy: 2, hopeful: 2, tired: 1, lonely: 1, confused: 0, anxious: 0 },
};

const MOODS = new Set<string>(Object.keys(MOOD_AFFINITY));

// ── Scoring ───────────────────────────────────────────────────

interface ScoredEvent {
  event:  NostrEvent;
  score:  number;
}

/**
 * Score and rank a list of Nostr events against an optional filter context.
 *
 * Scoring components (max 100):
 *   - Mood affinity   0–30
 *   - Language match  0–20
 *   - Recency         0–30  (decays over 7 days)
 *   - Random jitter   0–20  (ensures variety on repeat fetches)
 */
export function rankBottles(
  items: { event: NostrEvent; relay: string }[],
  filter: BottleFilter = {}
): { event: NostrEvent; relay: string }[] {
  const now = Math.floor(Date.now() / 1000);

  const scored = items.map((item) => ({
    item,
    score: scoreEvent(item.event, filter, now),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.item);
}

function scoreEvent(event: NostrEvent, filter: BottleFilter, now: number): number {
  let score = 0;

  // 1. Mood affinity
  const eventMood = getTag(event.tags, "mood");
  if (filter.mood && eventMood && MOODS.has(eventMood)) {
    const affinity = MOOD_AFFINITY[filter.mood]?.[eventMood as Mood] ?? 0;
    score += affinity * 10; // 0, 10, 20, or 30
  } else {
    score += 15; // neutral when no preference
  }

  // 2. Language match
  const eventLang = getTag(event.tags, "lang");
  if (filter.lang) {
    score += eventLang === filter.lang ? 20 : 0;
  } else {
    score += 10; // neutral
  }

  // 3. Recency (exponential decay over 7 days)
  const ageSec  = Math.max(0, now - event.created_at);
  const ageDay  = ageSec / 86400;
  const recency = Math.round(30 * Math.exp(-ageDay / 3.5)); // ~30 at 0d, ~0 at 14d
  score += recency;

  // 4. Random jitter for variety
  score += Math.floor(Math.random() * 20);

  return score;
}
