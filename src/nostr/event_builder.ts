// ============================================================
// Bicean — src/nostr/event_builder.ts
// Constructs kind:7777 unsigned Nostr events for drift bottles.
// ============================================================

import { DRIFT_BOTTLE_KIND }               from "../../types/index.js";
import type { UnsignedEvent, BottleInput, FuzzyLocation, EmotionResult } from "../../types/index.js";

// ── Builder ───────────────────────────────────────────────────

export interface BuildEventOptions {
  input:     BottleInput;
  pubkey:    string;
  location:  FuzzyLocation;
  emotion:   EmotionResult;
  /** Pre-encrypted content string (NIP-04 format). Overrides raw content. */
  encryptedContent?: string;
}

/**
 * Build an unsigned kind:7777 Nostr event for a drift bottle.
 * The caller must sign the returned object with event_signer.sign().
 */
export function buildDriftEvent(opts: BuildEventOptions): UnsignedEvent {
  const { input, pubkey, location, emotion, encryptedContent } = opts;

  const now    = Math.floor(Date.now() / 1000);
  const ttl    = input.ttl ?? 86400;
  const lang   = input.lang ?? emotion.tags.find(isSupportedLang) ?? "en";
  const mood   = input.mood ?? emotion.mood;
  const tone   = emotion.tone;

  // Core mandatory tags
  const tags: string[][] = [
    ["type", "drift"],
    ["mood", mood],
    ["tone", tone],
    ["lang", lang],
    ["ttl",  String(ttl)],
  ];

  // Optional user-supplied topic tags
  const userTags = input.tags ?? emotion.tags.filter((t) => !isSupportedLang(t));
  for (const t of userTags.slice(0, 10)) {
    tags.push(["t", t]);
  }

  // Coarse location tags
  if (location.country) tags.push(["country", location.country]);
  if (location.city)    tags.push(["city",    location.city]);
  if (location.lat)     tags.push(["lat",     location.lat]);
  if (location.lon)     tags.push(["lon",     location.lon]);

  // Ephemeral / burn-after-read marker
  if (input.ephemeral) {
    tags.push(["encrypted", "true"]);
  }

  return {
    pubkey,
    created_at: now,
    kind:       DRIFT_BOTTLE_KIND,
    tags,
    content:    encryptedContent ?? input.content,
  };
}

/**
 * Build an unsigned kind:7777 reply event.
 */
export function buildReplyEvent(opts: {
  content:         string;
  pubkey:          string;
  originalEventId: string;
  mood?:           string;
  lang?:           string;
}): UnsignedEvent {
  const { content, pubkey, originalEventId, mood, lang } = opts;

  const tags: string[][] = [
    ["type", "drift-reply"],
    ["e",    originalEventId],
  ];
  if (mood) tags.push(["mood", mood]);
  if (lang) tags.push(["lang", lang]);

  return {
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind:       DRIFT_BOTTLE_KIND,
    tags,
    content,
  };
}

// ── Tag parsing helpers ───────────────────────────────────────

export function getTag(tags: string[][], name: string): string | undefined {
  return tags.find(([k]) => k === name)?.[1];
}

export function getAllTags(tags: string[][], name: string): string[] {
  return tags.filter(([k]) => k === name).map(([, v]) => v);
}

// ── Internal ─────────────────────────────────────────────────

const SUPPORTED_LANGS = new Set(["zh", "en", "ja", "ko"]);

function isSupportedLang(v: string): boolean {
  return SUPPORTED_LANGS.has(v);
}
