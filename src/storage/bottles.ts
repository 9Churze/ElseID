// ============================================================
// Bicean — src/storage/bottles.ts
// Local SQLite CRUD for drift bottles. Handles TTL expiry
// and read-state tracking for ephemeral (burn-after-read) mode.
// ============================================================

import { getDb }                 from "./db.js";
import { getTag, getAllTags }     from "../nostr/event_builder.js";
import type { Bottle, NostrEvent, Mood, SupportedLang, TTLOption, FuzzyLocation } from "../../types/index.js";

// ── Save ──────────────────────────────────────────────────────

/**
 * Persist a fetched/sent drift bottle to the local DB.
 * Safe to call multiple times for the same event_id (INSERT OR IGNORE).
 */
export function saveBottle(event: NostrEvent, relay: string): void {
  const tags       = event.tags;
  const ttlRaw     = getTag(tags, "ttl");
  const ttlSec     = ttlRaw ? parseInt(ttlRaw, 10) : 86400;
  const expiresAt  = ttlSec > 0 ? event.created_at + ttlSec : null;
  const ephemeral  = getTag(tags, "encrypted") === "true" ? 1 : 0;

  getDb().prepare(`
    INSERT OR IGNORE INTO bottles
      (event_id, content, mood, tone, lang, tags, ttl,
       created_at, expires_at, relay,
       country, city, lat, lon, ephemeral)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    event.id,
    event.content,
    getTag(tags, "mood")    ?? null,
    getTag(tags, "tone")    ?? null,
    getTag(tags, "lang")    ?? null,
    JSON.stringify(getAllTags(tags, "t")),
    ttlSec,
    event.created_at,
    expiresAt,
    relay,
    getTag(tags, "country") ?? null,
    getTag(tags, "city")    ?? null,
    getTag(tags, "lat")     ?? null,
    getTag(tags, "lon")     ?? null,
    ephemeral
  );
}

// ── Get ───────────────────────────────────────────────────────

export function getBottle(eventId: string): Bottle | null {
  const row = getDb().prepare(`
    SELECT * FROM bottles WHERE event_id = ?
  `).get(eventId) as RawRow | undefined;

  return row ? rowToBottle(row) : null;
}

// ── List ──────────────────────────────────────────────────────

export interface ListFilter {
  mood?:  string;
  lang?:  string;
  limit?: number;
}

export function listBottles(filter: ListFilter = {}): Bottle[] {
  const now    = Math.floor(Date.now() / 1000);
  const limit  = filter.limit ?? 20;

  let query = `
    SELECT * FROM bottles
    WHERE (expires_at IS NULL OR expires_at > ?)
  `;
  const params: (string | number)[] = [now];

  if (filter.mood) { query += ` AND mood = ?`;  params.push(filter.mood); }
  if (filter.lang) { query += ` AND lang = ?`;  params.push(filter.lang); }

  query += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);

  const rows = getDb().prepare(query).all(...params) as RawRow[];
  return rows.map(rowToBottle);
}

// ── Mark read ─────────────────────────────────────────────────

/**
 * Mark a bottle as read. For ephemeral bottles this effectively
 * "burns" them — they won't be shown again.
 */
export function markRead(eventId: string): void {
  const now = Math.floor(Date.now() / 1000);
  getDb().prepare(`
    UPDATE bottles SET read_at = ? WHERE event_id = ?
  `).run(now, eventId);
}

// ── Purge ─────────────────────────────────────────────────────

/**
 * Delete all bottles whose TTL has expired or that have been read (if ephemeral).
 */
export function purgeExpired(): number {
  const now = Math.floor(Date.now() / 1000);
  const result = getDb().prepare(`
    DELETE FROM bottles
    WHERE (expires_at IS NOT NULL AND expires_at < ?)
       OR (ephemeral = 1 AND read_at IS NOT NULL)
  `).run(now);
  return result.changes;
}

// ── Row mapping ───────────────────────────────────────────────

interface RawRow {
  event_id:   string;
  content:    string;
  mood:       string | null;
  tone:       string | null;
  lang:       string | null;
  tags:       string | null;
  ttl:        number | null;
  created_at: number;
  expires_at: number | null;
  relay:      string;
  country:    string | null;
  city:       string | null;
  lat:        string | null;
  lon:        string | null;
  ephemeral:  number;
  read_at:    number | null;
}

function rowToBottle(row: RawRow): Bottle {
  const location: FuzzyLocation = {
    country: row.country ?? "XX",
    city:    row.city    ?? "Unknown",
    lat:     row.lat     ?? "0.0",
    lon:     row.lon     ?? "0.0",
  };

  let parsedTags: string[] = [];
  try { parsedTags = JSON.parse(row.tags ?? "[]") as string[]; } catch { /**/ }

  return {
    eventId:   row.event_id,
    content:   row.content,
    mood:      (row.mood  ?? "calm")  as Mood,
    tone:      row.tone   ?? undefined,
    lang:      (row.lang  ?? "en")    as SupportedLang,
    tags:      parsedTags,
    ttl:       (row.ttl   ?? 86400)   as TTLOption,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    relay:     row.relay,
    location,
    ephemeral: row.ephemeral === 1,
  };
}
