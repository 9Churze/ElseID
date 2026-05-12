// ============================================================
// Bicean — src/storage/drifters.ts
// Local SQLite CRUD for digital drifters and feedings.
// ============================================================

import { getDb } from "./db.js";
import type { Drifter, Feeding, HostingLog, DrifterStatus, FeedType } from "../../types/index.js";

// ── Drifter Persistence ────────────────────────────────────────

/**
 * Save our own created drifter.
 */
export function saveMyDrifter(drifter: Drifter): void {
  getDb().prepare(`
    INSERT INTO drifters (
      id, pubkey, privkey, name, personality, mood, tags,
      relay, departed_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    drifter.id,
    drifter.pubkey,
    drifter.privkey,
    drifter.name,
    drifter.personality,
    drifter.mood ?? null,
    JSON.stringify(drifter.tags),
    drifter.relay,
    drifter.departedAt,
    drifter.status
  );
}

/**
 * Update drifter status.
 */
export function updateDrifterStatus(id: string, status: DrifterStatus, abandonedAt?: number): void {
  if (abandonedAt) {
    getDb().prepare(`UPDATE drifters SET status = ?, abandoned_at = ? WHERE id = ?`).run(status, abandonedAt, id);
  } else {
    getDb().prepare(`UPDATE drifters SET status = ? WHERE id = ?`).run(status, id);
  }
}

/**
 * Update drifter last seen info.
 */
export function updateDrifterPresence(id: string, location: string, timestamp: number): void {
  getDb().prepare(`
    UPDATE drifters SET last_seen_loc = ?, last_seen_at = ? WHERE id = ?
  `).run(location, timestamp, id);
}

export function getDrifter(id: string): Drifter | null {
  const row = getDb().prepare(`SELECT * FROM drifters WHERE id = ?`).get(id) as any;
  if (!row) return null;
  return rowToDrifter(row);
}

export function getMyActiveDrifter(): Drifter | null {
  const row = getDb().prepare(`
    SELECT d.* FROM drifters d
    JOIN identities i ON d.id = i.active_drifter_id
    WHERE d.status = 'roaming'
    LIMIT 1
  `).get() as any;
  if (!row) return null;
  return rowToDrifter(row);
}

// ── Feeding Persistence ────────────────────────────────────────

export function saveFeeding(feeding: Feeding): void {
  getDb().prepare(`
    INSERT OR IGNORE INTO feedings (
      id, drifter_id, feeder_pubkey, feed_type, content,
      location_country, location_city, fed_at, relay
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    feeding.id,
    feeding.drifterId,
    feeding.feederPubkey,
    feeding.feedType,
    feeding.content,
    feeding.locationCountry ?? null,
    feeding.locationCity ?? null,
    feeding.fedAt,
    feeding.relay
  );
}

export function getFeedingsForDrifter(drifterId: string): Feeding[] {
  const rows = getDb().prepare(`
    SELECT * FROM feedings WHERE drifter_id = ? ORDER BY fed_at DESC
  `).all(drifterId) as any[];
  return rows.map(rowToFeeding);
}

// ── Hosting Log Persistence ────────────────────────────────────

export function saveHostingLog(log: HostingLog): void {
  getDb().prepare(`
    INSERT OR IGNORE INTO hosting_log (
      id, drifter_id, drifter_pubkey, drifter_name, arrived_at, feed_id, sent_off_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    log.id,
    log.drifterId,
    log.drifterPubkey,
    log.drifterName ?? null,
    log.arrivedAt,
    log.feedId ?? null,
    log.sentOffAt ?? null
  );
}

export function hasHostedBefore(drifterId: string): boolean {
  const row = getDb().prepare(`SELECT 1 FROM hosting_log WHERE drifter_id = ?`).get(drifterId);
  return !!row;
}

// ── Row mapping ───────────────────────────────────────────────

function rowToDrifter(row: any): Drifter {
  return {
    id:          row.id,
    pubkey:      row.pubkey,
    privkey:     row.privkey,
    name:        row.name,
    personality: row.personality,
    mood:        row.mood ?? undefined,
    tags:        JSON.parse(row.tags ?? "[]"),
    relay:       row.relay,
    departedAt:  row.departed_at,
    status:      row.status as DrifterStatus,
    abandonedAt: row.abandoned_at ?? undefined,
    lastSeenAt:  row.last_seen_at ?? undefined,
    lastSeenLoc: row.last_seen_loc ?? undefined,
  };
}

function rowToFeeding(row: any): Feeding {
  return {
    id:              row.id,
    drifterId:       row.drifter_id,
    feederPubkey:    row.feeder_pubkey,
    feedType:        row.feed_type as FeedType,
    content:         row.content,
    locationCountry: row.location_country ?? undefined,
    locationCity:    row.location_city    ?? undefined,
    fedAt:           row.fed_at,
    thankedAt:       row.thanked_at       ?? undefined,
    relay:           row.relay,
  };
}
