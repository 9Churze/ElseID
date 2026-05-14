// ElseID — src/nostr/event_builder.ts
// Constructs kind:7777 unsigned Nostr events for digital drifters.

import { DRIFTER_KIND } from "../../types/index.js";
import type { UnsignedEvent, Drifter, Feeding, FuzzyLocation, PersonalityAnalysis } from "../../types/index.js";

// Drifter Builder

export interface DrifterBuildOptions {
  pubkey:      string;
  name:        string;
  personality: string;
  analysis:    PersonalityAnalysis;
  location:    FuzzyLocation;
  content:     string; // The departure sentence
}

export function buildDrifterEvent(opts: DrifterBuildOptions): UnsignedEvent {
  const { pubkey, name, personality, analysis, location, content } = opts;

  const now = Math.floor(Date.now() / 1000);

  const tags: string[][] = [
    ["type",        "drifter"],
    ["name",        name],
    ["personality", personality],
    ["trait",       analysis.trait],
  ];

  for (const t of analysis.tags) {
    tags.push(["t", t]);
  }

  if (location.country) tags.push(["country", location.country]);
  if (location.city)    tags.push(["city",    location.city]);

  return {
    pubkey,
    created_at: now,
    kind:       DRIFTER_KIND,
    tags,
    content,
  };
}

// Feeding Builder

export interface FeedingBuildOptions {
  pubkey:          string;
  drifterEventId:  string;
  feedType:        string;
  content:         string;
  location:        FuzzyLocation;
  hostName?:       string | null;
}

export function buildFeedingEvent(opts: FeedingBuildOptions): UnsignedEvent {
  const { pubkey, drifterEventId, feedType, content, location, hostName } = opts;

  const tags: string[][] = [
    ["type",      "feeding"],
    ["e",         drifterEventId],
    ["feed_type", feedType],
  ];

  if (hostName) tags.push(["host_name", hostName]);
  if (location.country) tags.push(["country", location.country]);
  if (location.city)    tags.push(["city",    location.city]);

  return {
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind:       DRIFTER_KIND,
    tags,
    content,
  };
}

export function buildDeletionEvent(pubkey: string, eventIds: string[], reason = ""): any {
  return {
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind:       5,
    tags:       eventIds.map(id => ["e", id]),
    content:    reason,
  };
}

// Tag parsing helpers

export function getTag(tags: string[][], name: string): string | undefined {
  return tags.find(([k]) => k === name)?.[1];
}

export function getAllTags(tags: string[][], name: string): string[] {
  return tags.filter(([k]) => k === name).map(([, v]) => v);
}
